import React, { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button 
} from '@mui/material';

const Users = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.keys(data).map(key => ({ ...data[key], uid: key }));
        setUsers(userList);
      }
    });
  }, []);

  const handleApprove = (uid) => {
    const userRef = ref(db, 'users/' + uid);
    update(userRef, { status: 'active' });
  };

  const handleReject = (uid) => {
    const userRef = ref(db, 'users/' + uid);
    update(userRef, { status: 'rejected' });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4 }}>
        User Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Mobile</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobile}</TableCell>
                <TableCell>{user.address}</TableCell>
                <TableCell>{user.status}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.status === 'pending' && (
                    <>
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={() => handleApprove(user.uid)} 
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button 
                        variant="contained" 
                        color="error" 
                        onClick={() => handleReject(user.uid)}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Users;
