
import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Container, Typography, AppBar, Toolbar } from '@mui/material';

const Home = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="transparent" elevation={0}> 
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#424242' }}>
            Solution Club
          </Typography>
          <Button color="primary" component={Link} to="/login" sx={{ mr: 2 }}>
            Login
          </Button>
          <Button variant="contained" color="primary" component={Link} to="/signup">
            Sign Up
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md">
        <Box 
          sx={{
            my: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
            Welcome to the Employee Management Portal
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Streamline your workflow, manage your team, and boost productivity. All in one place.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button variant="contained" size="large" color="primary" component={Link} to="/signup">
              Get Started
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
