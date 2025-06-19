import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import authService from '../services/authService';
import NotFound from '../components/ErrorPage/notFound';

const AdminPanel = lazy(() => import('../AdminPanel/AdminPanel'));

const PrivateRoute = ({ children }) => {
    const user = authService.getCurrentUser();
    const role = authService.getRoleFromToken();

    if (!user) {
        return <Navigate to="/" />;
    }

    if (role !== "Admin") {
        return <Navigate to="/" />;
    }
    return children;
};

const AdminRoutes = () => (
    <Suspense>
        <Routes>
            <Route path="/panel" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />

            <Route path="*" element={<NotFound />} />
        </Routes>
    </Suspense>
);

export default AdminRoutes;