import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Lazy load pages
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const ProjectList = React.lazy(() => import('./pages/ProjectList'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
  </div>
);

function Layout() {
  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<ProjectList />} />
              <Route path="/:id" element={<ProjectDetail />} />
              <Route path="/:id/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-primary-500/30 selection:text-primary-200">
      <Routes>
        <Route path="/login" element={<React.Suspense fallback={<LoadingFallback />}><Login /></React.Suspense>} />
        <Route path="/signup" element={<React.Suspense fallback={<LoadingFallback />}><Signup /></React.Suspense>} />
        <Route path="/projects/*" element={<Layout />} />
        <Route path="/" element={<Navigate to="/projects" replace />} />
      </Routes>
    </div>
  );
}

export default App;
