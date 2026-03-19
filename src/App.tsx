import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExamPage from './pages/ExamPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [sbd, setSbd] = useState<string | null>(localStorage.getItem('sbd'));

  const handleLogin = (newSbd: string) => {
    localStorage.setItem('sbd', newSbd);
    setSbd(newSbd);
  };

  const handleLogout = () => {
    localStorage.removeItem('sbd');
    setSbd(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={sbd ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />} 
        />
        <Route 
          path="/dashboard" 
          element={sbd ? <DashboardPage sbd={sbd} onLogout={handleLogout} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/exam/:subject" 
          element={sbd ? <ExamPage sbd={sbd} /> : <Navigate to="/" />} 
        />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
