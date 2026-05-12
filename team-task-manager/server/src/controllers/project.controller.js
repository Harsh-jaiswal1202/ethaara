const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const { deleteUploadedFiles } = require('../utils/files');

const prisma = new PrismaClient();

// Create project
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, description } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        adminId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true, members: true } },
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// Get all projects for the logged-in user
const getProjects = async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
            admin: { select: { id: true, name: true } },
          },
        },
      },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      userRole: m.role,
    }));

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Get single project with members and tasks
const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        tasks: {
          include: {
            assignments: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: true, message: 'Project not found.', status: 404 });
    }

    // Attach user's role
    const membership = project.members.find((m) => m.userId === req.user.id);
    project.userRole = membership ? membership.role : null;

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// Add member to project by email
const addMember = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ errors: [{ field: 'email', message: 'Email is required.' }] });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ errors: [{ field: 'email', message: 'No user found with this email.' }] });
    }

    // Check if already a member
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: req.params.id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ errors: [{ field: 'email', message: 'User is already a member of this project.' }] });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: req.params.id,
        userId: user.id,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(member);

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.params.id}`).emit('projectUpdated');
    }
  } catch (error) {
    next(error);
  }
};

// Remove member from project
const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;

    // Cannot remove project admin
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project && project.adminId === userId) {
      return res.status(400).json({ error: true, message: 'Cannot remove the project admin.', status: 400 });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    res.json({ message: 'Member removed successfully.' });

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('projectUpdated');
    }
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: true, message: 'Member not found.', status: 404 });
    }
    next(error);
  }
};

// Delete project (ADMIN only)
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: true, message: 'Project not found.', status: 404 });
    }

    if (project.adminId !== req.user.id) {
      return res.status(403).json({ error: true, message: 'Only the project admin can delete this project.', status: 403 });
    }

    let attachments = [];
    try {
      attachments = await prisma.attachment.findMany({
        where: { task: { projectId: id } },
        select: { fileUrl: true },
      });
    } catch (err) {
      console.warn('⚠️ Could not fetch attachments for cleanup (table might be missing):', err.message);
    }

    if (attachments.length > 0) {
      deleteUploadedFiles(attachments);
    }

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Project deleted successfully.' });

    const io = req.app.get('io');
    if (io) {
      io.to(`project:${id}`).emit('projectDeleted', { projectId: id });
    }
  } catch (error) {
    next(error);
  }
};

// Global dashboard stats (across all user projects)
const getGlobalDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get all projects where user is a member
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            tasks: {
              include: {
                assignments: true,
              },
            },
          },
        },
      },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      userRole: m.role,
    }));

    // Aggregate tasks assigned to user
    const allTasks = [];
    projects.forEach((p) => {
      p.tasks.forEach((t) => {
        const isAssigned = t.assignments.some((a) => a.userId === userId);
        allTasks.push({ ...t, isAssigned, projectName: p.name });
      });
    });

    const myTasks = allTasks.filter((t) => t.isAssigned);
    
    const stats = {
      totalProjects: projects.length,
      totalTasks: allTasks.length,
      myTasksCount: myTasks.length,
      completedTasks: allTasks.filter((t) => t.status === 'DONE').length,
      myCompletedTasks: myTasks.filter((t) => t.status === 'DONE').length,
    };

    const now = new Date();
    const myOverdueTasks = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    // Tasks by status for charts (global)
    const byStatus = {
      TODO: allTasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: allTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      DONE: allTasks.filter((t) => t.status === 'DONE').length,
    };

    res.json({
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        taskCount: p.tasks.length,
        userRole: p.userRole
      })),
      stats,
      myOverdueTasks,
      byStatus
    });
  } catch (error) {
    next(error);
  }
};

// Dashboard stats
const getDashboard = async (req, res, next) => {
  try {
    const projectId = req.params.id;

    const [tasks, members] = await Promise.all([
      prisma.task.findMany({
        where: { projectId },
        include: {
          assignments: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.projectMember.findMany({
        where: { projectId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    const totalTasks = tasks.length;
    const byStatus = {
      TODO: tasks.filter((t) => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      DONE: tasks.filter((t) => t.status === 'DONE').length,
    };

    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    );

    // Tasks by user
    const userTaskMap = {};
    tasks.forEach((task) => {
      task.assignments.forEach((a) => {
        if (!userTaskMap[a.userId]) {
          userTaskMap[a.userId] = { userId: a.userId, name: a.user.name, count: 0 };
        }
        userTaskMap[a.userId].count++;
      });
    });
    const tasksByUser = Object.values(userTaskMap);

    res.json({
      totalTasks,
      byStatus,
      overdueTasks,
      tasksByUser,
      members: members.map((m) => ({ ...m.user, role: m.role })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getProjects, getProject, addMember, removeMember, deleteProject, getDashboard, getGlobalDashboard };
