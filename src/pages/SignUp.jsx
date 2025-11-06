import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, set, get } from 'firebase/database';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import Navbar from '../components/Navbar';

const SignUp = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      const isFirstUser = !snapshot.exists();

      const role = isFirstUser ? 'super admin' : 'user';
      const status = isFirstUser ? 'active' : 'pending';

      await set(ref(db, 'users/' + user.uid), {
        name,
        address,
        mobile,
        email: user.email,
        role,
        status,
        uid: user.uid,
      });

      navigate('/dashboard');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters long.');
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
          console.error(error);
          break;
      }
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="xs">
        <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Sign Up
          </Typography>
          <form onSubmit={handleSignUp} style={{ width: '100%' }}>
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Address"
              variant="outlined"
              fullWidth
              margin="normal"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <TextField
              label="Mobile"
              variant="outlined"
              fullWidth
              margin="normal"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
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
            {error && <Typography color="error" sx={{ my: 2 }}>{error}</Typography>}
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Sign Up
            </Button>
          </form>
          <Typography sx={{ mt: 2 }}>
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default SignUp;
