const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

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
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: true, message: 'Member not found.', status: 404 });
    }
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

module.exports = { createProject, getProjects, getProject, addMember, removeMember, getDashboard };
