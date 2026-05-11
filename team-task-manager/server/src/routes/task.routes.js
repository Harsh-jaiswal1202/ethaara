const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin, requireMembership } = require('../middleware/role.middleware');
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  createComment,
  uploadAttachment,
  deleteAttachment,
} = require('../controllers/task.controller');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create task (ADMIN only)
router.post(
  '/projects/:projectId/tasks',
  requireAdmin('projectId'),
  [
    body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 100 }).withMessage('Title must be under 100 characters.'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date.'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Priority must be LOW, MEDIUM, or HIGH.'),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']).withMessage('Status must be TODO, IN_PROGRESS, or DONE.'),
  ],
  createTask
);

// Get tasks for a project
router.get('/projects/:projectId/tasks', requireMembership('projectId'), getTasks);

// Update task
router.patch(
  '/:taskId',
  [
    body('title').optional().trim().isLength({ max: 100 }).withMessage('Title must be under 100 characters.'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date.'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Priority must be LOW, MEDIUM, or HIGH.'),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']).withMessage('Status must be TODO, IN_PROGRESS, or DONE.'),
  ],
  updateTask
);

// Delete task (ADMIN only — checked inside controller)
router.delete('/:taskId', deleteTask);

// Subtask Routes
router.post(
  '/:taskId/subtasks',
  [body('title').trim().notEmpty().withMessage('Subtask title is required.')],
  createSubtask
);

router.patch(
  '/:taskId/subtasks/:subtaskId',
  updateSubtask
);

router.delete(
  '/:taskId/subtasks/:subtaskId',
  deleteSubtask
);

// Comment Routes
router.post(
  '/:taskId/comments',
  [body('content').trim().notEmpty().withMessage('Comment cannot be empty.')],
  createComment
);

// Attachment Routes
const upload = require('../middleware/upload.middleware');

router.post(
  '/:taskId/attachments',
  upload.single('file'),
  uploadAttachment
);

router.delete(
  '/:taskId/attachments/:attachmentId',
  deleteAttachment
);

module.exports = router;
