const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin, requireMembership } = require('../middleware/role.middleware');
const {
  createLabel,
  getLabels,
  deleteLabel,
} = require('../controllers/label.controller');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create label
router.post(
  '/projects/:projectId/labels',
  requireAdmin('projectId'),
  [
    body('name').trim().notEmpty().withMessage('Label name is required.').isLength({ max: 30 }).withMessage('Name must be under 30 characters.'),
    body('color').optional().isString(),
  ],
  createLabel
);

// Get labels
router.get('/projects/:projectId/labels', requireMembership('projectId'), getLabels);

// Delete label
router.delete('/:labelId', deleteLabel);

module.exports = router;
