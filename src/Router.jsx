
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import AddEmployee from './pages/AddEmployee';
import TaskManagement from './pages/TaskManagement';
import Accounts from './pages/Accounts';
import SalaryManagement from './pages/SalaryManagement';
import EmployeeDetails from './pages/EmployeeDetails';
import Login from './pages/Login';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/dashboard/employees" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />}>
                    <Route path="employees" element={<EmployeeList />} />
                    <Route path="employee/:id" element={<EmployeeDetails />} />
                    <Route path="add-employee" element={<AddEmployee />} />
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="task-management" element={<TaskManagement />} />
                    <Route path="salary-management" element={<SalaryManagement />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
