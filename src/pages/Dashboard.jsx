
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
    AppBar, Box, CssBaseline, Drawer, IconButton, Toolbar, Typography, Button, 
    List, ListItem, ListItemIcon, ListItemText, Divider, ListItemButton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PeopleIcon from '@mui/icons-material/People';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Dashboard = (props) => {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItemButton onClick={() => navigate('/dashboard/add-employee')}>
          <ListItemIcon><AddCircleOutlineIcon /></ListItemIcon>
          <ListItemText primary="Add Employee" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/dashboard/employees')}>
          <ListItemIcon><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Employee List" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/dashboard/accounts')}>
          <ListItemIcon><AccountBoxIcon /></ListItemIcon>
          <ListItemText primary="Accounts" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/dashboard/task-management')}>
          <ListItemIcon><CheckCircleOutlineIcon /></ListItemIcon>
          <ListItemText primary="Task Management" />
        </ListItemButton>
         <ListItemButton onClick={() => navigate('/dashboard/salary-management')}>
          <ListItemIcon><MonetizationOnIcon /></ListItemIcon>
          <ListItemText primary="Salary Management" />
        </ListItemButton>
      </List>
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Employee Management System
          </Typography>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;
