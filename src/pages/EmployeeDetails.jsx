
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import {
    Box, Typography, Paper, Grid, Avatar, Chip, CircularProgress, Alert, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Button, Stack
} from '@mui/material';
import {
    Person as PersonIcon,
    Event as EventIcon,
    Home as HomeIcon,
    Fingerprint as FingerprintIcon,
    WhatsApp as WhatsAppIcon,
    AccountBalance as AccountBalanceIcon,
    CreditCard as CreditCardIcon,
    AccountCircle as AccountCircleIcon,
    Store as StoreIcon,
    PictureAsPdf as PictureAsPdfIcon,
    GridOn as GridOnIcon,
    AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const EmployeeDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [salaryHistoryData, setSalaryHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [calculatedSalaryHistory, setCalculatedSalaryHistory] = useState([]);

  useEffect(() => {
    const employeeRef = ref(db, `employees/${id}`);
    const salaryHistoryRef = ref(db, 'config/salaryHistory');

    const unsubscribeEmployee = onValue(employeeRef, (snapshot) => {
      if (snapshot.exists()) {
        setEmployee({ id: snapshot.key, ...snapshot.val() });
      } else {
        setError('Employee not found.');
      }
      setLoading(false);
    }, (error) => {
        console.error("Firebase error (employee): ", error);
        setError("Failed to fetch employee details.");
        setLoading(false);
    });

    const unsubscribeSalary = onValue(salaryHistoryRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const loadedHistory = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .sort((a, b) => a.effectiveDate - b.effectiveDate); // Sort oldest to newest
            setSalaryHistoryData(loadedHistory);
        }
    }, (error) => {
        console.error("Firebase error (salary): ", error);
        setError("Failed to fetch salary history. Please check database rules.");
    });

    return () => {
        unsubscribeEmployee();
        unsubscribeSalary();
    };
  }, [id]);

  useEffect(() => {
    if (employee && salaryHistoryData.length > 0) {
        const history = calculateSalaryHistory();
        setCalculatedSalaryHistory(history);
    }
  }, [employee, salaryHistoryData]);

  const getSalaryForMonth = (monthDate) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);

    let applicableSalary = null;
    for (const record of salaryHistoryData) {
        if (record.effectiveDate <= monthStart.getTime()) {
            applicableSalary = record.amount;
        } else {
            break;
        }
    }
    return applicableSalary;
  };

  const calculateSalaryHistory = () => {
    const history = [];
    if (!employee?.joiningDate || salaryHistoryData.length === 0) return history;

    // Parse the joining date 'DD/MM/YYYY'
    const joiningDateParts = employee.joiningDate.split('/');
    const joiningDate = new Date(parseInt(joiningDateParts[2]), parseInt(joiningDateParts[1]) - 1, parseInt(joiningDateParts[0]));

    let loopDate = new Date(joiningDate);
    // Start looping from the first day of the joining month
    loopDate.setDate(1); 
    
    const endDate = new Date();

    while (loopDate <= endDate) {
        const grossSalaryForMonth = getSalaryForMonth(loopDate);

        if (grossSalaryForMonth !== null) {
            const year = loopDate.getFullYear();
            const month = loopDate.getMonth();
            const monthYear = `${loopDate.toLocaleString('default', { month: 'long' })} ${year}`;
            
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dailyRate = grossSalaryForMonth / daysInMonth;
            
            const tasks = employee.tasks || {};
            let deductionDays = 0;
            Object.keys(tasks).forEach(taskDateStr => {
                const taskDate = new Date(taskDateStr);
                if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
                    const status = tasks[taskDateStr].status;
                    if (status === 'Not Done') {
                        deductionDays += 1;
                    }
                }
            });

            let finalGrossSalary = grossSalaryForMonth;

            // Check if this is the first month of employment
            if (year === joiningDate.getFullYear() && month === joiningDate.getMonth()) {
                const startDay = joiningDate.getDate();
                if (startDay > 1) {
                    // Prorate the salary if they joined mid-month
                    const workedDays = daysInMonth - startDay + 1;
                    finalGrossSalary = workedDays * dailyRate;
                }
            }
            
            const totalDeductionAmount = deductionDays * dailyRate;
            const netSalary = finalGrossSalary - totalDeductionAmount;

            history.push({
                monthYear,
                grossSalary: finalGrossSalary,
                deductionDays: deductionDays,
                netSalary: netSalary
            });
        }

        // Move to the next month
        loopDate.setMonth(loopDate.getMonth() + 1);
    }

    return history.reverse();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportSalaryToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Salary History for ${employee.fullName}`, 14, 16);
    autoTable(doc, {
        startY: 20,
        head: [['Month', 'Gross Salary', 'Deduction Days', 'Net Salary']],
        body: calculatedSalaryHistory.map(s => [
            s.monthYear,
            `Rs. ${s.grossSalary.toFixed(2)}`,
            s.deductionDays,
            `Rs. ${s.netSalary.toFixed(2)}`
        ]),
    });
    doc.save(`SalaryHistory_${employee.indexNo}.pdf`);
  };

  const exportSalaryToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
        calculatedSalaryHistory.map(s => ({
            Month: s.monthYear,
            'Gross Salary (Rs.)': s.grossSalary,
            'Deduction Days': s.deductionDays,
            'Net Salary (Rs.)': s.netSalary
        }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary History");
    XLSX.writeFile(workbook, `SalaryHistory_${employee.indexNo}.xlsx`);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!employee) {
    return <Alert severity="info">No employee data available.</Alert>;
  }
  
  const tasks = employee.tasks || {};
  const taskHistory = Object.keys(tasks)
    .map(date => ({ date, ...tasks[date] }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const paginatedTasks = taskHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const currentSalary = salaryHistoryData.length > 0 ? salaryHistoryData[salaryHistoryData.length -1].amount : 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Paper elevation={10} sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: '20px' }}>
        <Grid container spacing={{ xs: 3, md: 5 }}>
          {/* Employee Header */}
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ width: 140, height: 140, mb: 2, bgcolor: 'secondary.main' }}>{employee.fullName.charAt(0)}</Avatar>
            <Typography variant="h4" component="h1" fontWeight="bold">{employee.fullName}</Typography>
            <Chip label={`Index No: ${employee.indexNo}`} color="primary" sx={{mt: 1}}/>
          </Grid>

          {/* Salary Display Card */}
          <Grid item xs={12}>
            <Card sx={{borderRadius: '16px', background: 'rgba(240, 242, 245, 0.7)'}}>
                <CardHeader title="Financial Overview" titleTypographyProps={{variant: 'h5', fontWeight: '600'}} />
                <CardContent>
                    {currentSalary > 0 ? (
                        <DetailItem icon={<AttachMoneyIcon />} label="Current Global Monthly Salary" value={`Rs. ${currentSalary.toFixed(2)}`} />
                    ) : (
                        <Alert severity="warning">No global salary has been set. Please go to the <strong>Salary Management</strong> page to set one.</Alert>
                    )}
                </CardContent>
            </Card>
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={6}>
              <Card sx={{borderRadius: '16px', background: 'rgba(240, 242, 245, 0.7)', height: '100%'}}>
                  <CardHeader title="Personal Information" titleTypographyProps={{variant: 'h5', fontWeight: '600'}}/>
                  <CardContent><Grid container spacing={2}>
                      <Grid item xs={12}><DetailItem icon={<EventIcon />} label="Joining Date" value={employee.joiningDate} /></Grid>
                      <Grid item xs={12}><DetailItem icon={<FingerprintIcon />} label="ID Number" value={employee.idNumber} /></Grid>
                      <Grid item xs={12}><DetailItem icon={<WhatsAppIcon />} label="WhatsApp Number" value={employee.whatsappNumber} /></Grid>
                  </Grid></CardContent>
              </Card>
          </Grid>

          {/* Bank Information */}
          <Grid item xs={12} md={6}>
              <Card sx={{borderRadius: '16px', background: 'rgba(240, 242, 245, 0.7)', height: '100%'}}>
                <CardHeader title="Bank Account" titleTypographyProps={{variant: 'h5', fontWeight: '600'}} />
                <CardContent><Grid container spacing={2}>
                    <Grid item xs={12}><DetailItem icon={<AccountCircleIcon />} label="Holder Name" value={employee.bankHolderName} /></Grid>
                    <Grid item xs={12}><DetailItem icon={<CreditCardIcon />} label="Account Number" value={employee.accountNumber} /></Grid>
                    <Grid item xs={12}><DetailItem icon={<AccountBalanceIcon />} label="Bank Name" value={employee.bankName} /></Grid>
                </Grid></CardContent>
              </Card>
          </Grid>
          
          {/* Salary History */}
          <Grid item xs={12}>
            <Card sx={{borderRadius: '16px', background: 'rgba(240, 242, 245, 0.7)'}}>
                <CardHeader 
                    title="Salary History" 
                    action={
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" onClick={exportSalaryToPDF} startIcon={<PictureAsPdfIcon />}>PDF</Button>
                            <Button variant="outlined" size="small" onClick={exportSalaryToExcel} startIcon={<GridOnIcon />}>Excel</Button>
                        </Stack>
                    }
                />
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead><TableRow>
                                <TableCell>Month</TableCell>
                                <TableCell>Gross Salary</TableCell>
                                <TableCell>Deduction Days</TableCell>
                                <TableCell>Net Salary</TableCell>
                            </TableRow></TableHead>
                            <TableBody>
                                {calculatedSalaryHistory.length > 0 ? calculatedSalaryHistory.map((s, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{s.monthYear}</TableCell>
                                        <TableCell>Rs. {s.grossSalary.toFixed(2)}</TableCell>
                                        <TableCell>{s.deductionDays}</TableCell>
                                        <TableCell>Rs. {s.netSalary.toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={4} align="center">No salary history to display.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
          </Grid>

          {/* Task History */}
          <Grid item xs={12}>
            <Card sx={{borderRadius: '16px', background: 'rgba(240, 242, 245, 0.7)'}}>
                <CardHeader title="Tasks History"/>
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead><TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Details</TableCell>
                            </TableRow></TableHead>
                            <TableBody>
                                {paginatedTasks.length > 0 ? paginatedTasks.map((task, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{new Date(task.date + 'T00:00:00').toLocaleDateString()}</TableCell>
                                        <TableCell><Chip label={task.status || 'Full Completed'} color={task.status === 'Not Done' ? 'error' : task.status === 'Half Done' ? 'warning' : 'success'} /></TableCell>
                                        <TableCell>{task.details || '-'}</TableCell>
                                    </TableRow>
                                )) : (
                                  <TableRow><TableCell colSpan={3} align="center">No task history.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[15, 25, 50, 100, 250, 500, 1000]}
                      component="div"
                      count={taskHistory.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Paper>
    </Box>
  );
};

const DetailItem = ({ icon, label, value }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: '12px', minHeight: '70px' }}>
        <Box sx={{ mr: 2, color: 'primary.main' }}>{icon}</Box>
        <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{value || 'N/A'}</Typography>
        </Box>
    </Box>
);

export default EmployeeDetails;
