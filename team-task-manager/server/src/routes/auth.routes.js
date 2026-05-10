const express = require('express');
const { body } = require('express-validator');
const { signup, login } = require('../controllers/auth.controller');

const router = express.Router();

router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

module.exports = router;
