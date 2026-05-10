# Team Task Manager

A full-stack collaborative project management tool built with React, Vite, Node.js, Express, and PostgreSQL.

![Project Dashboard Screenshot Placeholder](/path/to/screenshot.png)

**Live URL**: [Deploying to Railway...](#deployment-guide)  
**GitHub Repo**: [Your Repository URL](#)

## Features
- **Authentication**: JWT-based secure login and signup
- **Project Management**: Create projects, view progress, and track team members
- **Task Board**: Kanban-style board (To Do, In Progress, Done)
- **Role-Based Access**: Admins can manage members and tasks; Members can only update status of their assigned tasks
- **Analytics Dashboard**: Visual charts for task distribution and overdue task tracking
- **Modern UI**: Dark-themed glassmorphism design with Tailwind CSS

## Tech Stack
- **Frontend**: React 18, Vite, React Router v6, Tailwind CSS v4, Recharts, HeadlessUI/Heroicons
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: jsonwebtoken, bcryptjs

## Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL server running locally

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory and add:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```
Run database migrations and seed demo data:
```bash
npm run db:migrate
npm run db:seed
```
Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory and add:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the Vite development server:
```bash
npm run dev
```

## Demo Credentials
After running the seed script (`npm run db:seed`), you can log in with:
- **Admin Role**: `admin@demo.com` / `demo1234`
- **Member Role**: `member@demo.com` / `demo1234`

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Server | PostgreSQL connection string |
| `JWT_SECRET` | Server | Secret key for signing JWT tokens |
| `PORT` | Server | Backend server port (default 5000) |
| `NODE_ENV` | Server | `development` or `production` |
| `CLIENT_URL` | Server | Allowed CORS origin (frontend URL) |
| `VITE_API_URL` | Client | Backend API base URL |

## API Endpoints

| Endpoint | Method | Protected | Role Needed | Description |
|----------|--------|-----------|-------------|-------------|
| `/api/auth/signup` | POST | No | Any | Register a new user |
| `/api/auth/login` | POST | No | Any | Authenticate and get JWT |
| `/api/projects` | GET | Yes | Any | Get all projects for logged-in user |
| `/api/projects` | POST | Yes | Any | Create a new project |
| `/api/projects/:id` | GET | Yes | Member | Get project details (tasks & members) |
| `/api/projects/:id/members` | POST | Yes | Admin | Add a user to project by email |
| `/api/projects/:id/members/:userId` | DELETE | Yes | Admin | Remove member from project |
| `/api/projects/:id/dashboard` | GET | Yes | Member | Get project stats and dashboard data |
| `/api/tasks/projects/:projectId/tasks` | POST | Yes | Admin | Create a new task |
| `/api/tasks/projects/:projectId/tasks` | GET | Yes | Member | Get tasks (filtered by role permissions) |
| `/api/tasks/:taskId` | PATCH | Yes | Admin/Assignee | Update task (Member can only update status) |
| `/api/tasks/:taskId` | DELETE | Yes | Admin | Delete a task |

## Role Permissions

| Action | ADMIN | MEMBER |
|--------|-------|--------|
| Create Project | ✅ | ✅ |
| Add/Remove Members | ✅ | ❌ |
| Create Tasks | ✅ | ❌ |
| Edit Task Title/Description/Date | ✅ | ❌ |
| Assign Tasks to Users | ✅ | ❌ |
| Change Status of Assigned Task | ✅ | ✅ |
| Change Status of Unassigned Task | ✅ | ❌ |
| Delete Task | ✅ | ❌ |
| View Dashboard & Analytics | ✅ | ✅ |

## Railway Deployment Guide

1. Push your code to a GitHub repository.
2. Log in to [Railway.app](https://railway.app/).
3. Create a **New Project** → **Deploy from GitHub repo**.
4. Select your repository. Railway will detect the setup.
5. In your Railway project, click **New** → **Database** → **Add PostgreSQL**.
6. Go to the backend service settings → **Variables**:
   - `DATABASE_URL` (Auto-filled by PostgreSQL plugin, but you might need to manually link or type it)
   - `JWT_SECRET` = `<generate a secure random string>`
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = `<Your Vercel/Railway frontend public URL>`
7. Go to backend **Settings** → **Deploy** → **Start Command** and set it to:
   ```bash
   npm run db:deploy && npm start
   ```
8. **For the Frontend** (Can be deployed as a static service on Railway or Vercel):
   - Set the build command to `npm run build`
   - Set the output directory to `dist`
   - Ensure you set the frontend environment variable **BEFORE** building:
     `VITE_API_URL` = `<Your Railway backend public URL>/api`
