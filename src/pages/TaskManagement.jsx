
import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import {
  Container, Typography, Box, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Select, MenuItem, Button, FormControl, InputLabel, Grid, TablePagination
} from '@mui/material';
import Swal from 'sweetalert2';

const TaskManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [tasks, setTasks] = useState({}); // { employeeId: { status: '', details: '' } }
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEmployees = [];
      const initialTasks = {};
      for (const id in data) {
        loadedEmployees.push({ id, ...data[id] });
        let taskForDate = { status: '', details: '' }; // Default state
        // Check for tasks on the selected date
        if (data[id].tasks && data[id].tasks[selectedDate]) {
            const savedTask = data[id].tasks[selectedDate];
            // If the saved status is 'Full Completed', we want the dropdown to show 'None' ('').
            // Otherwise, we show the saved status ('Half Done' or 'Not Done').
            taskForDate = {
                status: savedTask.status === 'Full Completed' ? '' : savedTask.status,
                details: savedTask.details || ''
            };
        }
        initialTasks[id] = taskForDate;
      }
      // Sort by indexNo numerically
      loadedEmployees.sort((a, b) => {
        const aIndex = a.indexNo ? parseInt(String(a.indexNo), 10) : 0;
        const bIndex = b.indexNo ? parseInt(String(b.indexNo), 10) : 0;
        return aIndex - bIndex;
      });
      setEmployees(loadedEmployees);
    });

    return () => unsubscribe();
  }, [selectedDate]);

  useEffect(() => {
    const filtered = employees.filter(emp =>
      String(emp.indexNo || '').toLowerCase().includes(search.toLowerCase())
    );
    setFilteredEmployees(filtered);
    // Reset to first page whenever search/filter changes
    setPage(0);
  }, [search, employees]);

  const handleTaskChange = (employeeId, field, value) => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [employeeId]: {
        ...prevTasks[employeeId],
        [field]: value,
        // Reset details if status is not 'Half Done'
        ...(field === 'status' && value !== 'Half Done' && { details: '' }),
      }
    }));
  };

  const handleSaveAllTasks = () => {
    const updates = {};
    const validationErrors = [];

    // Iterate through EVERY employee, not just the filtered or paginated ones, to ensure all are updated.
    for (const employee of employees) {
        const employeeId = employee.id;
        const currentTaskState = tasks[employeeId] || { status: '', details: '' };

        // Validation: If a task is 'Half Done', it must have details.
        if (currentTaskState.status === 'Half Done' && (!currentTaskState.details || currentTaskState.details.trim() === '')) {
            validationErrors.push(`Please provide details for employee with Index No: ${employee.indexNo}.`);
            continue; // Skip to the next employee
        }

        const taskPath = `employees/${employeeId}/tasks/${selectedDate}`;
        let dataToSave;

        if (currentTaskState.status === 'Half Done' || currentTaskState.status === 'Not Done') {
            // If status is explicitly 'Half Done' or 'Not Done', save it.
            dataToSave = currentTaskState;
        } else {
            // If status is '' (i.e., 'None' was selected), explicitly save it as 'Full Completed'.
            dataToSave = { status: 'Full Completed', details: '' };
        }
        updates[taskPath] = dataToSave;
    }

    if (validationErrors.length > 0) {
      Swal.fire('Validation Error', validationErrors.join('<br>'), 'error');
      return;
    }

    if (Object.keys(updates).length === 0) {
        Swal.fire('No Employees', 'There are no employees to update.', 'info');
        return;
    }

    update(ref(db), updates)
      .then(() => {
        Swal.fire('Success', 'All task updates have been saved successfully.', 'success');
      })
      .catch(error => {
        console.error("Error updating tasks: ", error);
        Swal.fire('Error', 'Failed to save task updates.', 'error');
      });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Paginate the filtered list
  const paginatedEmployees = filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Task Management
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select a date, then mark tasks for employees who are 'Half Done' or 'Not Done'. All other employees will be considered 'Full Completed' for the selected date.
        </Typography>
        <Paper sx={{ p: 2, my: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
                <TextField
                    fullWidth
                    label="Search by Index No"
                    variant="outlined"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField
                    fullWidth
                    label="Select Date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </Grid>
          </Grid>
        </Paper>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Index No</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Status for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</TableCell>
                <TableCell>Details (if Half Done)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((emp) => {
                const currentTask = tasks[emp.id] || { status: '', details: '' };
                return (
                  <TableRow key={emp.id}>
                    <TableCell>{emp.indexNo}</TableCell>
                    <TableCell>{emp.fullName}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={currentTask.status}
                          label="Status"
                          onChange={(e) => handleTaskChange(emp.id, 'status', e.target.value)}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          <MenuItem value={'Half Done'}>Half Done</MenuItem>
                          <MenuItem value={'Not Done'}>Not Done</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        label="Details"
                        value={currentTask.details}
                        onChange={(e) => handleTaskChange(emp.id, 'details', e.target.value)}
                        disabled={currentTask.status !== 'Half Done'}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
            rowsPerPageOptions={[15, 25, 50, 100, 250, 500, 1000]}
            component="div"
            count={filteredEmployees.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary" size="large" onClick={handleSaveAllTasks}>
                Save All Changes
            </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default TaskManagement;
