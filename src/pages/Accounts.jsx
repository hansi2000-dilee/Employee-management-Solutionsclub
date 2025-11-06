
import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { db } from '../firebase';
import { 
    Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Checkbox, IconButton, Toolbar, Tooltip, TablePagination 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
import "jspdf-autotable";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [no, setNo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerDate, setRegisterDate] = useState('');
  const [registerNo, setRegisterNo] = useState('');
  const [paymentReceiptNo, setPaymentReceiptNo] = useState('');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const accountsRef = ref(db, 'accounts');
    onValue(accountsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedAccounts = [];
      for (let id in data) {
        loadedAccounts.push({ id, ...data[id] });
      }
      setAccounts(loadedAccounts);
      setFilteredAccounts(loadedAccounts);
    });
  }, []);

  const handleAddAccount = () => {
    if (!no || !email || !password) {
        Swal.fire('Error', 'Please fill in all fields.', 'error');
        return;
    }
    const newAccount = { no, email, password, registerDate, registerNo, paymentReceiptNo };
    push(ref(db, 'accounts'), newAccount)
      .then(() => {
        Swal.fire('Success', 'Account added successfully!', 'success');
        setNo('');
        setEmail('');
        setPassword('');
        setRegisterDate('');
        setRegisterNo('');
        setPaymentReceiptNo('');
      })
      .catch((error) => {
        Swal.fire('Error', 'Failed to add account.', 'error');
        console.error("Add account error: ", error);
      });
  };

  const handleDelete = (ids) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${ids.length} account(s). You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = ids.map(id => remove(ref(db, `accounts/${id}`)));
        Promise.all(deletePromises)
            .then(() => {
                Swal.fire('Deleted!', 'The selected account(s) have been deleted.', 'success');
                setSelected([]);
            })
            .catch(error => {
                Swal.fire('Error!', 'An error occurred while deleting accounts.', 'error');
            });
      }
    });
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredAccounts.map((n) => n.id);
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

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        let workbook;
        try {
            const data = event.target.result;
            workbook = XLSX.read(data, { type: "binary" });
        } catch (error) {
            console.error("Error reading Excel file:", error);
            Swal.fire('Error', 'Could not read the file. It may be corrupted, password-protected, or in an unsupported format.', 'error');
            return; 
        }

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            Swal.fire('Error', 'The Excel file appears to be empty or does not contain any sheets.', 'error');
            return;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        let headerRow;
        try {
            headerRow = (XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] || []);
        } catch (jsonError) {
            console.error("Error parsing sheet to get header:", jsonError);
            Swal.fire('Error', 'Could not parse the Excel sheet. Please ensure it is a standard table format.', 'error');
            return;
        }

        if (headerRow.length === 0) {
            Swal.fire('Error', 'The first sheet of the Excel file does not contain a header row.', 'error');
            return;
        }

        const headers = headerRow.map(h => String(h).trim());
        const expectedHeaders = ['no', 'email', 'password', 'registerDate', 'registerNo', 'paymentReceiptNo'];
        const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            Swal.fire('Error', `Invalid Excel format. The following required headers are missing: ${missingHeaders.join(', ')}.`, 'error');
            return;
        }

        const parsedData = XLSX.utils.sheet_to_json(sheet);

        if (parsedData.length === 0) {
            Swal.fire('Info', 'The Excel file has the correct headers but contains no data to upload.', 'info');
            return;
        }

        try {
            const accountsRef = ref(db, 'accounts');
            const uploadPromises = parsedData.map(account => {
                const newAccount = {};
                expectedHeaders.forEach(header => {
                    const value = account[header];
                    newAccount[header] = value !== undefined && value !== null ? String(value) : "";
                });
                return push(accountsRef, newAccount);
            });
            await Promise.all(uploadPromises);

            Swal.fire('Success', `Successfully uploaded ${parsedData.length} accounts!`, 'success');
        } catch (dbError) {
            console.error("Firebase database error:", dbError);
            Swal.fire('Error', 'An error occurred while saving the data to the database. This is often caused by Firebase security rules. Please ensure you have permission to write to the database.', 'error');
        }
    };

    reader.onerror = () => {
        console.error("File reading error.");
        Swal.fire('Error', 'A problem occurred while trying to read the file from your computer.', 'error');
    };
    
    reader.readAsBinaryString(file);
    e.target.value = ''; 
};

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(accounts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accounts");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'});
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'accounts.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
        head: [['No', 'Email', 'Password', 'Register Date', 'Register No', 'Payment Receipt No']],
        body: accounts.map(acc => [acc.no, acc.email, acc.password, acc.registerDate, acc.registerNo, acc.paymentReceiptNo]),
    });
    doc.save('accounts.pdf');
  };


  const headCells = [
    { id: 'no', numeric: false, disablePadding: true, label: 'No' },
    { id: 'email', numeric: false, disablePadding: false, label: 'Email' },
    { id: 'password', numeric: false, disablePadding: false, label: 'Password' },
    { id: 'registerDate', numeric: false, disablePadding: false, label: 'Register Date' },
    { id: 'registerNo', numeric: false, disablePadding: false, label: 'Register No' },
    { id: 'paymentReceiptNo', numeric: false, disablePadding: false, label: 'Payment Receipt No' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>Add New Account</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={2}><TextField fullWidth label="No." value={no} onChange={e => setNo(e.target.value)} /></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth label="Email" value={email} onChange={e => setEmail(e.target.value)} /></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} /></Grid>
          <Grid item xs={12} sm={2}><TextField fullWidth label="Register Date" value={registerDate} onChange={e => setRegisterDate(e.target.value)} /></Grid>
          <Grid item xs={12} sm={2}><TextField fullWidth label="Register No" value={registerNo} onChange={e => setRegisterNo(e.target.value)} /></Grid>
          <Grid item xs={12} sm={3}><TextField fullWidth label="Payment Receipt No" value={paymentReceiptNo} onChange={e => setPaymentReceiptNo(e.target.value)} /></Grid>
          <Grid item xs={12} sm={1}><Button variant="contained" onClick={handleAddAccount}>Add</Button></Grid>
        </Grid>
      </Paper>

        <Paper sx={{ width: '100%', mb: 2, p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>Upload from Excel</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>Ensure your Excel file has headers: <strong>no</strong>, <strong>email</strong>, <strong>password</strong>, <strong>registerDate</strong>, <strong>registerNo</strong>, and <strong>paymentReceiptNo</strong>.</Typography>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ marginTop: '20px' }} />
        </Paper>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, ...(selected.length > 0 && { bgcolor: 'primary.main' })}}>
          {selected.length > 0 ? (
            <Typography sx={{ flex: '1 1 100%', color: 'white' }} variant="subtitle1" component="div">{selected.length} selected</Typography>
          ) : (
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">Accounts ({accounts.length})</Typography>
          )}

          {selected.length > 0 ? (
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(selected)}><DeleteIcon sx={{color: 'white'}} /></IconButton>
            </Tooltip>
          ) : (
            <Box>
              <Tooltip title="Export to Excel">
                <IconButton onClick={exportToExcel}><FileDownloadIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Export to PDF">
                <IconButton onClick={exportToPDF}><FileDownloadIcon /></IconButton>
              </Tooltip>
            </Box>
          )}
        </Toolbar>
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredAccounts.length}
                    checked={filteredAccounts.length > 0 && selected.length === filteredAccounts.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {headCells.map((headCell) => (
                  <TableCell key={headCell.id} align={headCell.numeric ? 'right' : 'left'} padding={headCell.disablePadding ? 'none' : 'normal'}>
                    {headCell.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAccounts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const isItemSelected = isSelected(row.id);
                  return (
                    <TableRow hover onClick={(event) => handleClick(event, row.id)} role="checkbox" aria-checked={isItemSelected} tabIndex={-1} key={row.id} selected={isItemSelected}>
                      <TableCell padding="checkbox"><Checkbox color="primary" checked={isItemSelected} /></TableCell>
                      <TableCell component="th" scope="row" padding="none">{row.no}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.password}</TableCell>
                      <TableCell>{row.registerDate}</TableCell>
                      <TableCell>{row.registerNo}</TableCell>
                      <TableCell>{row.paymentReceiptNo}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredAccounts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default Accounts;
