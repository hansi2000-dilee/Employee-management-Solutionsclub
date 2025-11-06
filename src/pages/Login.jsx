
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import Navbar from '../components/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get currentUser from context

  // Redirect if user is already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard/employee-list');
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The useEffect will handle the redirect
    } catch (error) {
      setError("Failed to log in. Please check your email and password.");
      console.error("Login error: ", error);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="xs">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Login
          </Typography>
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Typography color="error" align="center">{error}</Typography>}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Login
            </Button>
          </form>
          <Typography sx={{ mt: 2 }}>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default Login;
