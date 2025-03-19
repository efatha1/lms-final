import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Dashboard from './pages/Dashboard';
import LoanApplications from './pages/LoanApplications';
import CashFlow from './pages/CashFlow';
import Repayments from './pages/Repayments';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/loan-applications" element={
              <ProtectedRoute>
                <LoanApplications />
              </ProtectedRoute>
            } />
            
            <Route path="/cash-flow" element={
              <ProtectedRoute>
                <CashFlow />
              </ProtectedRoute>
            } />
            
            <Route path="/repayments" element={
              <ProtectedRoute>
                <Repayments />
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);