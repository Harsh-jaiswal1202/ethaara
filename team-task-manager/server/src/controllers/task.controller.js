const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/email');
const { deleteUploadedFiles } = require('../utils/files');

const prisma = new PrismaClient();

const getTaskAccess = async (taskId, userId) => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignments: true,
      attachments: { select: { id: true, fileUrl: true, userId: true } },
    },
  });

  if (!task) return { task: null };

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: task.projectId,
        userId,
      },
    },
  });

  const isAdmin = member?.role === 'ADMIN';
  const isAssigned = task.assignments.some((a) => a.userId === userId);

  return { task, member, isAdmin, isAssigned };
};

// Create task (ADMIN only)
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { title, description, dueDate, priority, status, assigneeIds, labelIds } = req.body;
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
        labels: labelIds && labelIds.length > 0
          ? {
              create: labelIds.map((labelId) => ({ labelId })),
            }
          : undefined,
        subtasks: req.body.subtasks && req.body.subtasks.length > 0
          ? {
              create: req.body.subtasks.map((title) => ({ title })),
            }
          : undefined,
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        labels: {
          include: { label: true }
        },
        subtasks: {
          orderBy: { createdAt: 'asc' }
        },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
    });

    res.status(201).json(task);
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('taskUpdated');
    }

    // Send email notifications to assignees
    if (task.assignments && task.assignments.length > 0) {
      task.assignments.forEach(async (assignment) => {
        try {
          await sendEmail({
            email: assignment.user.email,
            subject: `New Task Assigned: ${task.title}`,
            html: `
              <h1>You have a new task!</h1>
              <p>You have been assigned to <strong>${task.title}</strong> in the project.</p>
              <p>Priority: ${task.priority}</p>
              <p>Status: ${task.status}</p>
              <br/>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">View on Task Board</a>
            `,
          });
        } catch (emailErr) {
          console.error('Email notification failed for', assignment.user.email);
        }
      });
    }

  } catch (error) {
    next(error);
  }
};

// Get tasks for a project
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        labels: { include: { label: true } },
        subtasks: { orderBy: { createdAt: 'asc' } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        attachments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' },
    });

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

    const { task, member, isAdmin, isAssigned } = await getTaskAccess(taskId, req.user.id);

    if (!task) {
      return res.status(404).json({ error: true, message: 'Task not found.', status: 404 });
    }

    if (!member) {
      return res.status(403).json({ error: true, message: 'Not a project member.', status: 403 });
    }

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ error: true, message: 'You are not assigned to this task.', status: 403 });
    }

    let updateData;
    if (isAdmin) {
      // Admin can update any field
      const { title, description, dueDate, priority, status, assigneeIds, labelIds } = req.body;
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

      // Handle label updates
      if (labelIds !== undefined) {
        await prisma.taskLabel.deleteMany({ where: { taskId } });
        if (labelIds.length > 0) {
          await prisma.taskLabel.createMany({
            data: labelIds.map((labelId) => ({ taskId, labelId })),
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

    // Generate Activity Log
    const activitiesData = [];
    if (updateData.status && updateData.status !== task.status) {
      activitiesData.push({ taskId, userId: req.user.id, action: `changed status to ${updateData.status}` });
    }
    if (updateData.priority && updateData.priority !== task.priority) {
      activitiesData.push({ taskId, userId: req.user.id, action: `changed priority to ${updateData.priority}` });
    }
    if (req.body.assigneeIds !== undefined) {
      activitiesData.push({ taskId, userId: req.user.id, action: `updated assignees` });
    }
    if (req.body.labelIds !== undefined) {
      activitiesData.push({ taskId, userId: req.user.id, action: `updated labels` });
    }

    if (activitiesData.length > 0) {
      await prisma.activity.createMany({ data: activitiesData });
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
        labels: { include: { label: true } },
        subtasks: { orderBy: { createdAt: 'asc' } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        attachments: { orderBy: { createdAt: 'desc' } }
      },
    });

    res.json(updatedTask);

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${updatedTask.projectId}`).emit('taskUpdated');
    }
  } catch (error) {
    next(error);
  }
};

// Delete task (ADMIN only)
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const { task, member, isAdmin } = await getTaskAccess(taskId, req.user.id);
    if (!task) {
      return res.status(404).json({ error: true, message: 'Task not found.', status: 404 });
    }

    if (!member || !isAdmin) {
      return res.status(403).json({ error: true, message: 'Admin access required.', status: 403 });
    }

    deleteUploadedFiles(task.attachments);

    await prisma.task.delete({ where: { id: taskId } });

    res.json({ message: 'Task deleted successfully.' });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${task.projectId}`).emit('taskUpdated');
    }
  } catch (error) {
    next(error);
  }
};

// Subtask Controllers
const createSubtask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const { task, member, isAdmin } = await getTaskAccess(taskId, req.user.id);
    if (!task) return res.status(404).json({ error: true, message: 'Task not found.' });
    if (!member || !isAdmin) return res.status(403).json({ error: true, message: 'Admin access required.' });

    const subtask = await prisma.subtask.create({
      data: { title, taskId },
    });

    const io = req.app.get('io');
    if (io) io.to(`project:${task.projectId}`).emit('taskUpdated');

    res.status(201).json(subtask);
  } catch (error) {
    next(error);
  }
};

const updateSubtask = async (req, res, next) => {
  try {
    const { taskId, subtaskId } = req.params;
    const { isCompleted, title } = req.body;

    const { task, member, isAdmin, isAssigned } = await getTaskAccess(taskId, req.user.id);
    if (!task) return res.status(404).json({ error: true, message: 'Task not found.' });
    if (!member) return res.status(403).json({ error: true, message: 'Not a project member.' });
    if (!isAdmin && !isAssigned) return res.status(403).json({ error: true, message: 'You are not assigned to this task.' });

    if (!isAdmin && title !== undefined) {
      return res.status(403).json({ error: true, message: 'Members can only update checklist completion.', status: 403 });
    }

    const updateData = {};
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (title !== undefined) updateData.title = title;

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: updateData,
    });

    const io = req.app.get('io');
    if (io) io.to(`project:${task.projectId}`).emit('taskUpdated');

    res.json(subtask);
  } catch (error) {
    next(error);
  }
};

const deleteSubtask = async (req, res, next) => {
  try {
    const { taskId, subtaskId } = req.params;

    const { task, member, isAdmin } = await getTaskAccess(taskId, req.user.id);
    if (!task) return res.status(404).json({ error: true, message: 'Task not found.' });
    if (!member || !isAdmin) return res.status(403).json({ error: true, message: 'Admin access required.' });

    await prisma.subtask.delete({ where: { id: subtaskId } });

    const io = req.app.get('io');
    if (io) io.to(`project:${task.projectId}`).emit('taskUpdated');

    res.json({ message: 'Subtask deleted' });
  } catch (error) {
    next(error);
  }
};

// Comment Controllers
const createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const { task, member } = await getTaskAccess(taskId, req.user.id);
    if (!task) return res.status(404).json({ error: true, message: 'Task not found.' });
    if (!member) return res.status(403).json({ error: true, message: 'Not a project member.' });

    const taskForNotification = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    const comment = await prisma.comment.create({
      data: { content, taskId, userId: req.user.id },
      include: { user: { select: { id: true, name: true } } }
    });

    const io = req.app.get('io');
    if (io) io.to(`project:${task.projectId}`).emit('taskUpdated');

    // Notify all assignees except the commenter
    if (taskForNotification?.assignments && taskForNotification.assignments.length > 0) {
      taskForNotification.assignments.forEach(async (assignment) => {
        if (assignment.userId !== req.user.id) {
          try {
            await sendEmail({
              email: assignment.user.email,
              subject: `New Comment on: ${task.title}`,
              html: `
                <p><strong>${req.user.name}</strong> commented on <strong>${task.title}</strong>:</p>
                <blockquote style="padding: 10px; background: #f4f4f4; border-left: 4px solid #ccc;">
                  ${content}
                </blockquote>
                <br/>
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">View Task</a>
              `,
            });
          } catch (emailErr) {
            console.error('Comment notification failed for', assignment.user.email);
          }
        }
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

// Attachment Controllers
const uploadAttachment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded.' });
    }

    const { task, member } = await getTaskAccess(taskId, req.user.id);
    if (!task) return res.status(404).json({ error: true, message: 'Task not found.' });
    if (!member) return res.status(403).json({ error: true, message: 'Not a project member.' });

    const fileUrl = `/uploads/${req.file.filename}`;
    
    const attachment = await prisma.attachment.create({
      data: {
        fileName: req.file.originalname,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        taskId,
        userId: req.user.id
      }
    });

    const io = req.app.get('io');
    if (io) io.to(`project:${task.projectId}`).emit('taskUpdated');

    res.status(201).json(attachment);
  } catch (error) {
    next(error);
  }
};

const deleteAttachment = async (req, res, next) => {
  try {
    const { taskId, attachmentId } = req.params;

    const { task, member, isAdmin } = await getTaskAccess(taskId, req.user.id);
    if (!task) return res.status(404).json({ error: true, message: 'Task not found.' });
    if (!member) return res.status(403).json({ error: true, message: 'Not a project member.' });

    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (!attachment) return res.status(404).json({ error: true, message: 'Attachment not found.' });
    if (!isAdmin && attachment.userId !== req.user.id) {
      return res.status(403).json({ error: true, message: 'Only admins or the uploader can delete this attachment.' });
    }

    deleteUploadedFiles([attachment]);

    await prisma.attachment.delete({ where: { id: attachmentId } });

    const io = req.app.get('io');
    if (io) io.to(`project:${task.projectId}`).emit('taskUpdated');

    res.json({ message: 'Attachment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  createTask, 
  getTasks, 
  updateTask, 
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createComment,
  uploadAttachment,
  deleteAttachment
};
