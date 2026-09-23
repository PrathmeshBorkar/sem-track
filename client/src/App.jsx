import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import SidebarRail from './components/SidebarRail.jsx';
import api from './api.js';

import LoginPage from './components/LoginPage.jsx';
import RegisterPage from './components/RegisterPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import SubjectsPage from './components/SubjectsPage.jsx';
import SubjectDetailPage from './components/SubjectDetailPage.jsx';
import DeadlinesPage from './components/DeadlinesPage.jsx';
import SmartAddBox from './components/SmartAddBox.jsx';

function AppLayout() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        if (user) {
            api.get('/api/gpa')
                .then(setStats)
                .catch(() => {});
        }
    }, [user]);

    return (
        <div className="workbench-layout">
            <Navbar />
            <SidebarRail stats={stats} />
            <main className="workbench-content">
                <ProtectedRoute />
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Application Routes */}
                <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/subjects" element={<SubjectsPage />} />
                    <Route path="/subjects/:id" element={<SubjectDetailPage />} />
                    <Route path="/deadlines" element={<DeadlinesPage />} />
                    <Route path="/smart-add" element={<SmartAddBox />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AuthProvider>
    );
}