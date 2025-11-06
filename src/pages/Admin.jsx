import React from 'react';
import { useAuth } from '../context/AuthContext';
import Users from './Users';

const Admin = () => {
  const { role } = useAuth();

  if (role !== 'super admin') {
    return <div>You do not have permission to view this page.</div>;
  }

  return <Users />;
};

export default Admin;
