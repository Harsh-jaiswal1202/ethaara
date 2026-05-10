const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.taskAssignment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo1234', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Demo Admin',
      email: 'admin@demo.com',
      password: hashedPassword,
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      name: 'Demo Member',
      email: 'member@demo.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Created demo users');

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: 'Demo Project',
      description: 'A sample project to demonstrate the Task Manager features. Explore tasks, manage members, and track progress!',
      adminId: adminUser.id,
    },
  });

  // Add both users as project members
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: adminUser.id,
      role: 'ADMIN',
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: memberUser.id,
      role: 'MEMBER',
    },
  });

  console.log('✅ Created demo project with members');

  // Create sample tasks
  const now = new Date();
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Design system architecture',
        description: 'Create the overall system architecture diagram and document the tech stack decisions.',
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (overdue)
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment.',
        dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
        priority: 'HIGH',
        status: 'TODO',
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement user authentication',
        description: 'Build the login and signup flow with JWT tokens.',
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        priority: 'MEDIUM',
        status: 'DONE',
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Create dashboard analytics',
        description: 'Build charts and statistics for the project dashboard.',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'MEDIUM',
        status: 'TODO',
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Write API documentation',
        description: 'Document all REST API endpoints with request/response examples.',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        priority: 'LOW',
        status: 'TODO',
        projectId: project.id,
      },
    }),
  ]);

  console.log('✅ Created 5 sample tasks');

  // Assign tasks to users
  // Task 1: assigned to admin
  await prisma.taskAssignment.create({
    data: { taskId: tasks[0].id, userId: adminUser.id },
  });
  // Task 2: assigned to member
  await prisma.taskAssignment.create({
    data: { taskId: tasks[1].id, userId: memberUser.id },
  });
  // Task 3: assigned to both
  await prisma.taskAssignment.createMany({
    data: [
      { taskId: tasks[2].id, userId: adminUser.id },
      { taskId: tasks[2].id, userId: memberUser.id },
    ],
  });
  // Task 4: assigned to member
  await prisma.taskAssignment.create({
    data: { taskId: tasks[3].id, userId: memberUser.id },
  });
  // Task 5: assigned to admin
  await prisma.taskAssignment.create({
    data: { taskId: tasks[4].id, userId: adminUser.id },
  });

  console.log('✅ Assigned tasks to users');
  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin: admin@demo.com / demo1234');
  console.log('  Member: member@demo.com / demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
