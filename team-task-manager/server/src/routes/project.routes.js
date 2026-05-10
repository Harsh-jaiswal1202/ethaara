const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin, requireMembership } = require('../middleware/role.middleware');
const {
  createProject,
  getProjects,
  getProject,
  addMember,
  removeMember,
  getDashboard,
} = require('../controllers/project.controller');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create project
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required.'),
  ],
  createProject
);

// Get all projects for logged-in user
router.get('/', getProjects);

// Get single project
router.get('/:id', requireMembership('id'), getProject);

// Dashboard
router.get('/:id/dashboard', requireMembership('id'), getDashboard);

// Add member (ADMIN only)
router.post('/:id/members', requireAdmin('id'), addMember);

// Remove member (ADMIN only)
router.delete('/:id/members/:userId', requireAdmin('id'), removeMember);

module.exports = router;
