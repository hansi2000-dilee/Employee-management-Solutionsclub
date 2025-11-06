
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../firebase';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, IconButton, 
    TableSortLabel, Box, Typography, Toolbar, Tooltip, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, TextField, TablePagination, Grid
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('indexNo');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Dialog State
  const [editOpen, setEditOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const employeesRef = ref(db, 'employees');
    onValue(employeesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEmployees = [];
      for (let id in data) {
        loadedEmployees.push({ id, ...data[id] });
      }
       // Sort by indexNo numerically
      loadedEmployees.sort((a, b) => {
        const aIndex = a.indexNo ? parseInt(a.indexNo, 10) : 0;
        const bIndex = b.indexNo ? parseInt(b.indexNo, 10) : 0;
        return aIndex - bIndex;
      });
      setEmployees(loadedEmployees);
    });
  }, []);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredEmployees.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenEditDialog = (employee) => {
    setCurrentEmployee(employee);
    setEditOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditOpen(false);
    setCurrentEmployee(null);
  };

  const handleUpdateEmployee = () => {
    if (!currentEmployee) return;
    const employeeRef = ref(db, `employees/${currentEmployee.id}`);
    update(employeeRef, currentEmployee)
      .then(() => {
        Swal.fire('Updated!', 'Employee details have been updated.', 'success');
        handleCloseEditDialog();
      })
      .catch((error) => {
        Swal.fire('Error!', 'Could not update employee details.', 'error');
        console.error("Update error: ", error);
      });
  };
  
  const handleDelete = (ids) => {
    Swal.fire({
        title: 'Are you sure?',
        text: `You are about to delete ${ids.length} employee(s). You won't be able to revert this!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
            let completed = 0;
            ids.forEach(id => {
                const employeeRef = ref(db, `employees/${id}`);
                remove(employeeRef).then(() => {
                    completed++;
                    if (completed === ids.length) {
                        Swal.fire(
                          'Deleted!',
                          'The selected employee(s) have been deleted.',
                          'success'
                        );
                        setSelected([]); // Clear selection after deletion
                    }
                }).catch(error => {
                     Swal.fire(
                        'Error!',
                        'An error occurred while deleting employees.',
                        'error'
                      );
                });
            });
        }
      });
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleRowClick = (id) => {
    navigate(`/dashboard/employee/${id}`);
  };

  const filteredEmployees = employees.filter((employee) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true; // show all if search is empty

    const searchableFields = [
        employee.fullName,
        employee.whatsappNumber,
        employee.idNumber,
        employee.indexNo
    ];

    return searchableFields.some(field => 
        field?.toString().toLowerCase().includes(query)
    );
});


  const headCells = [
    { id: 'indexNo', numeric: true, disablePadding: false, label: 'Index No' },
    { id: 'fullName', numeric: false, disablePadding: false, label: 'Full Name' },
    { id: 'joiningDate', numeric: false, disablePadding: false, label: 'Joining Date' },
    { id: 'whatsappNumber', numeric: false, disablePadding: false, label: 'WhatsApp Number' },
    { id: 'idNumber', numeric: false, disablePadding: false, label: 'ID Number' },
    { id: 'actions', numeric: true, disablePadding: false, label: 'Actions' },
  ];

  function EnhancedTableHead(props) {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
    const createSortHandler = (property) => (event) => {
      onRequestSort(event, property);
    };
  
    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Checkbox
              color="primary"
              indeterminate={numSelected > 0 && numSelected < rowCount}
              checked={rowCount > 0 && numSelected === rowCount}
              onChange={onSelectAllClick}
              inputProps={{ 'aria-label': 'select all employees' }}
            />
          </TableCell>
          {headCells.map((headCell) => (
            <TableCell
              key={headCell.id}
              align={headCell.numeric ? 'right' : 'left'}
              padding={headCell.disablePadding ? 'none' : 'normal'}
              sortDirection={orderBy === headCell.id ? order : false}
            >
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={headCell.id !== 'actions' ? createSortHandler(headCell.id) : undefined}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    );
  }

  function EnhancedTableToolbar(props) {
    const { numSelected } = props;
  
    return (
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, ...(numSelected > 0 && { bgcolor: 'primary.main' })}}>
        {numSelected > 0 ? (
          <Typography sx={{ flex: '1 1 100%', color: 'white' }} variant="subtitle1" component="div">
            {numSelected} selected
          </Typography>
        ) : (
          <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
            Employee List
          </Typography>
        )}
  
        {numSelected > 0 && (
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(selected)}>
              <DeleteIcon sx={{color: 'white'}} />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    );
  }

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredEmployees.length) : 0;

  return (
    <Box sx={{ width: '100%' }}>
         <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          label="Search by Name, Phone, ID, or Index No"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <EnhancedTableToolbar numSelected={selected.length} />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={filteredEmployees.length}
            />
            <TableBody>
              {filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={() => handleRowClick(row.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onClick={(event) => {
                                event.stopPropagation(); 
                                handleClick(event, row.id)}
                            }
                            inputProps={{ 'aria-labelledby': labelId }}
                        />
                      </TableCell>
                      <TableCell component="th" id={labelId} scope="row"> {row.indexNo} </TableCell>
                      <TableCell>{row.fullName}</TableCell>
                      <TableCell>{row.joiningDate}</TableCell>
                      <TableCell>{row.whatsappNumber}</TableCell>
                      <TableCell>{row.idNumber}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(row); }}>
                            <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }} >
                  <TableCell colSpan={7} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[20, 50, 100, 200, 500, 1000]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={handleCloseEditDialog} maxWidth="md">
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
            <Grid container spacing={2} sx={{mt: 1}}>
                <Grid item xs={12} sm={6}><TextField label="Index No" value={currentEmployee?.indexNo || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, indexNo: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Full Name" value={currentEmployee?.fullName || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, fullName: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Google Form Filled Date" value={currentEmployee?.googleFormFilledDate || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, googleFormFilledDate: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Joining Date" value={currentEmployee?.joiningDate || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, joiningDate: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Address" value={currentEmployee?.address || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, address: e.target.value})} fullWidth multiline rows={3}/></Grid>
                <Grid item xs={12} sm={6}><TextField label="ID Number" value={currentEmployee?.idNumber || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, idNumber: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="WhatsApp Number" value={currentEmployee?.whatsappNumber || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, whatsappNumber: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Account Number" value={currentEmployee?.accountNumber || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, accountNumber: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Bank Name" value={currentEmployee?.bankName || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, bankName: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Bank Holder Name" value={currentEmployee?.bankHolderName || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, bankHolderName: e.target.value})} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Branch" value={currentEmployee?.branch || ''} onChange={(e) => setCurrentEmployee({...currentEmployee, branch: e.target.value})} fullWidth /></Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateEmployee} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
