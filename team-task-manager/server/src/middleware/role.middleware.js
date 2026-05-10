const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const requireAdmin = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params[paramName] || req.params.projectId;
      if (!projectId) {
        return res.status(400).json({ error: true, message: 'Project ID is required.', status: 400 });
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!member || member.role !== 'ADMIN') {
        return res.status(403).json({ error: true, message: 'Admin access required.', status: 403 });
      }

      req.projectMember = member;
      next();
    } catch (error) {
      next(error);
    }
  };
};

const requireMembership = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const projectId = req.params[paramName] || req.params.projectId;
      if (!projectId) {
        return res.status(400).json({ error: true, message: 'Project ID is required.', status: 400 });
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!member) {
        return res.status(403).json({ error: true, message: 'You are not a member of this project.', status: 403 });
      }

      req.projectMember = member;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { requireAdmin, requireMembership };
