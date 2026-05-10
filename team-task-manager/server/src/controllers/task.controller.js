const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Create task (ADMIN only)
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { title, description, dueDate, priority, status, assigneeIds } = req.body;
    const { projectId } = req.params;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        projectId,
        assignments: assigneeIds && assigneeIds.length > 0
          ? {
              create: assigneeIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// Get tasks for a project
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const isAdmin = req.projectMember && req.projectMember.role === 'ADMIN';

    let tasks;
    if (isAdmin) {
      // Admin sees all tasks
      tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignments: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Member sees only assigned tasks
      tasks = await prisma.task.findMany({
        where: {
          projectId,
          assignments: {
            some: { userId: req.user.id },
          },
        },
        include: {
          assignments: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// Update task
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignments: true },
    });

    if (!task) {
      return res.status(404).json({ error: true, message: 'Task not found.', status: 404 });
    }

    // Check role
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!member) {
      return res.status(403).json({ error: true, message: 'Not a project member.', status: 403 });
    }

    const isAdmin = member.role === 'ADMIN';
    const isAssigned = task.assignments.some((a) => a.userId === req.user.id);

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ error: true, message: 'You are not assigned to this task.', status: 403 });
    }

    let updateData;
    if (isAdmin) {
      // Admin can update any field
      const { title, description, dueDate, priority, status, assigneeIds } = req.body;
      updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;

      // Handle assignee updates
      if (assigneeIds !== undefined) {
        // Delete all existing assignments and re-create
        await prisma.taskAssignment.deleteMany({ where: { taskId } });
        if (assigneeIds.length > 0) {
          await prisma.taskAssignment.createMany({
            data: assigneeIds.map((userId) => ({ taskId, userId })),
          });
        }
      }
    } else {
      // Member can only update status
      if (req.body.status) {
        updateData = { status: req.body.status };
      } else {
        return res.status(403).json({ error: true, message: 'Members can only update task status.', status: 403 });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// Delete task (ADMIN only)
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return res.status(404).json({ error: true, message: 'Task not found.', status: 404 });
    }

    // Verify admin
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: true, message: 'Admin access required.', status: 403 });
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
