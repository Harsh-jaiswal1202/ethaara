const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Create label (ADMIN only)
const createLabel = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { name, color } = req.body;
    const { projectId } = req.params;

    // Check if label exists in project
    const existing = await prisma.label.findUnique({
      where: {
        projectId_name: {
          projectId,
          name,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ errors: [{ field: 'name', message: 'Label with this name already exists in the project.' }] });
    }

    const label = await prisma.label.create({
      data: {
        name,
        color: color || 'slate',
        projectId,
      },
    });

    res.status(201).json(label);
  } catch (error) {
    next(error);
  }
};

// Get labels for a project
const getLabels = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    let labels = [];
    try {
      labels = await prisma.label.findMany({
        where: { projectId },
        orderBy: { name: 'asc' },
      });
    } catch (err) {
      console.warn('⚠️ Could not fetch labels (table might be missing):', err.message);
    }

    res.json(labels);
  } catch (error) {
    next(error);
  }
};

// Delete label (ADMIN only)
const deleteLabel = async (req, res, next) => {
  try {
    const { labelId } = req.params;

    const label = await prisma.label.findUnique({ where: { id: labelId } });
    if (!label) {
      return res.status(404).json({ error: true, message: 'Label not found.', status: 404 });
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: label.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: true, message: 'Admin access required.', status: 403 });
    }

    await prisma.label.delete({ where: { id: labelId } });

    res.json({ message: 'Label deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLabel, getLabels, deleteLabel };
