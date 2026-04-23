import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ExamView from './pages/ExamView';
import ReviewView from './pages/ReviewView';
import Navbar from './components/Navbar';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#FDFCF9] text-[#1A1A1A] font-sans flex flex-col">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-10 py-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/exam/:id" element={<PrivateRoute><ExamView /></PrivateRoute>} />
              <Route path="/review/:attemptId" element={<PrivateRoute><ReviewView /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
