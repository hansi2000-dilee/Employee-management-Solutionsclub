import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';

const Welcome = () => {
  return (
    <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Infinitive Solutions
          </Typography>
          <Button color="inherit" component={Link} to="/login">Login</Button>
          <Button color="inherit" component={Link} to="/signup">Sign Up</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box
          sx={{
            my: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
          }}
        >
          <Typography variant="h1" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Welcome to Infinitive Solutions
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            The future of user management is here.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ mx: 1 }}>
              Get Started
            </Button>
            <Button variant="outlined" color="primary" component={Link} to="/login" sx={{ mx: 1 }}>
              Sign In
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Welcome;
