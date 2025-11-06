
import React from 'react';
import AppRouter from './Router';
import { AuthProvider } from './context/AuthContext';
import './firebase'; // Import the firebase configuration

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
