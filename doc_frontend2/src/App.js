import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import BoardView from './pages/BoardView';
import Dashboard from './pages/Dashboard';
import TaskBoardView from './pages/BoardView/TaskBoardView';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/" /> : <Signup />} />
            <Route path="*" element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen bg-skin-main">
                  <Navbar />
                  <div className="flex flex-1 overflow-hidden p-3 space-x-3">
                    <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 bg-skin-primary rounded-lg overflow-hidden">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="board/:url" element={<BoardView />} />
                        <Route path="taskboard/:boardId" element={<TaskBoardView />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
          <ToastContainer />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
