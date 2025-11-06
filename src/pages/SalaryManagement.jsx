
import React, { useState, useEffect } from 'react';
import { ref, onValue, push } from 'firebase/database';
import { db } from '../firebase';
import {
  Container, Typography, Box, TextField, Button, Paper, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, CircularProgress
} from '@mui/material';
import Swal from 'sweetalert2';

const SalaryManagement = () => {
  const [newSalary, setNewSalary] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [companySalaryHistory, setCompanySalaryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingReport, setLoadingReport] = useState(true);

  useEffect(() => {
    const historyRef = ref(db, 'config/salaryHistory');
    const employeesRef = ref(db, 'employees');

    const unsubscribeHistory = onValue(historyRef, (snapshot) => {
      const loadedHistory = snapshot.exists() 
        ? Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] })).sort((a, b) => b.effectiveDate - a.effectiveDate)
        : [];
      setSalaryHistory(loadedHistory);
    });

    const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
        const loadedEmployees = snapshot.exists()
          ? Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }))
          : [];
        setEmployees(loadedEmployees);
    });

    return () => {
        unsubscribeHistory();
        unsubscribeEmployees();
    };
  }, []);

  useEffect(() => {
    if (employees.length > 0 && salaryHistory.length > 0) {
        setLoadingReport(true);
        const report = calculateCompanyWideSalary();
        setCompanySalaryHistory(report);
        setLoadingReport(false);
    } else if (employees.length === 0 || salaryHistory.length === 0) {
        // If there's no data, stop the loading spinner
        setLoadingReport(false);
    }
  }, [employees, salaryHistory]);

  const getSalaryForMonth = (monthDate, localSalaryHistory) => {
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    let applicableSalary = null;
    const sortedHistory = [...localSalaryHistory].sort((a, b) => a.effectiveDate - b.effectiveDate);
    for (const record of sortedHistory) {
        if (record.effectiveDate <= monthStart.getTime()) {
            applicableSalary = record.amount;
        } else {
            break;
        }
    }
    return applicableSalary;
  };

  const calculateCompanyWideSalary = () => {
    const report = [];
    if (employees.length === 0 || salaryHistory.length === 0) return report;

    let earliestJoiningDate = new Date();
    let hasValidEmployee = false;
    employees.forEach(emp => {
        if (emp.joiningDate && typeof emp.joiningDate === 'string') {
            const joiningDateParts = emp.joiningDate.split('/');
            const joiningDate = new Date(parseInt(joiningDateParts[2]), parseInt(joiningDateParts[1]) - 1, parseInt(joiningDateParts[0]));
            if (joiningDate < earliestJoiningDate) {
                earliestJoiningDate = joiningDate;
                hasValidEmployee = true;
            }
        }
    });

    if (!hasValidEmployee) return report; // No employees with valid joining dates found

    let loopDate = new Date(earliestJoiningDate);
    loopDate.setDate(1);
    const endDate = new Date();

    while (loopDate <= endDate) {
        const year = loopDate.getFullYear();
        const month = loopDate.getMonth();
        const monthYear = `${loopDate.toLocaleString('default', { month: 'long' })} ${year}`;
        let totalMonthExpense = 0;

        employees.forEach(employee => {
            // **FIX**: Ensure employee has a valid joiningDate before processing
            if (!employee.joiningDate || typeof employee.joiningDate !== 'string') return;

            const joiningDateParts = employee.joiningDate.split('/');
            const joiningDate = new Date(parseInt(joiningDateParts[2]), parseInt(joiningDateParts[1]) - 1, parseInt(joiningDateParts[0]));
            
            if (joiningDate > new Date(year, month + 1, 0)) return;

            const grossSalaryForMonth = getSalaryForMonth(loopDate, salaryHistory);

            if (grossSalaryForMonth !== null) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const dailyRate = grossSalaryForMonth / daysInMonth;
                
                let deductionDays = 0;
                const tasks = employee.tasks || {};
                Object.keys(tasks).forEach(taskDateStr => {
                    const taskDate = new Date(taskDateStr);
                    if (taskDate.getFullYear() === year && taskDate.getMonth() === month) {
                        if (tasks[taskDateStr].status === 'Not Done') {
                            deductionDays += 1;
                        }
                    }
                });

                let finalGrossSalary = grossSalaryForMonth;
                if (year === joiningDate.getFullYear() && month === joiningDate.getMonth()) {
                    const startDay = joiningDate.getDate();
                    if (startDay > 1) {
                        const workedDays = daysInMonth - startDay + 1;
                        finalGrossSalary = workedDays * dailyRate;
                    }
                }
                
                const totalDeductionAmount = deductionDays * dailyRate;
                const netSalary = finalGrossSalary - totalDeductionAmount;
                totalMonthExpense += netSalary > 0 ? netSalary : 0;
            }
        });

        report.push({ monthYear, totalExpense: totalMonthExpense });
        loopDate.setMonth(loopDate.getMonth() + 1);
    }

    return report.reverse();
  };

  const handleSaveSalary = () => {
    const salaryAmount = parseFloat(newSalary);
    if (isNaN(salaryAmount) || !isFinite(salaryAmount) || salaryAmount < 0) {
      Swal.fire('Invalid Input', 'Please enter a valid, non-negative number for the salary.', 'error');
      return;
    }
    if (!effectiveDate) {
        Swal.fire('Invalid Input', 'Please select an effective date.', 'error');
        return;
    }
    if (salaryHistory.length > 0 && salaryHistory[0].amount === salaryAmount) {
        Swal.fire('No Change', 'The new salary is the same as the current one.', 'info');
        return;
    }
    const selectedDate = new Date(effectiveDate); selectedDate.setHours(0, 0, 0, 0);
    const timestamp = selectedDate.getTime();
    setLoading(true);
    push(ref(db, 'config/salaryHistory'), { amount: salaryAmount, effectiveDate: timestamp })
      .then(() => {
        Swal.fire('Success', 'New global salary has been set successfully!', 'success');
        setNewSalary('');
      })
      .catch(error => {
        console.error("Error updating global salary: ", error);
        Swal.fire('Error', 'Failed to update global salary.', 'error');
      })
      .finally(() => { setLoading(false); });
  };

  const currentSalary = salaryHistory.length > 0 ? salaryHistory[0].amount : 0;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: '12px', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>Global Salary Management</Typography>
            <Typography variant="h5" sx={{ textAlign: 'center', mb: 2, color: 'primary.main'}}>Current Global Salary: Rs. {currentSalary.toFixed(2)}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>Set a new fixed monthly salary that will apply to all employees going forward.</Typography>
            {/* **FIX**: Updated Grid syntax */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid xs={12} sm={6}>
                    <TextField fullWidth label="New Global Monthly Salary" variant="outlined" type="number" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }} />
                </Grid>
                <Grid xs={12} sm={6}>
                    <TextField fullWidth label="Effective Date" variant="outlined" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}><Button variant="contained" color="primary" size="large" onClick={handleSaveSalary} disabled={loading}>{loading ? 'Saving...' : 'Save New Salary'}</Button></Box>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>Salary History</Typography>
            <TableContainer component={Paper} sx={{ borderRadius: '12px'}}><Table><TableHead><TableRow><TableCell sx={{fontWeight: 'bold'}}>Effective Date</TableCell><TableCell sx={{fontWeight: 'bold'}} align="right">Amount</TableCell></TableRow></TableHead><TableBody>{salaryHistory.map((entry) => (<TableRow key={entry.id}><TableCell>{new Date(entry.effectiveDate).toLocaleDateString()}</TableCell><TableCell align="right">Rs. {entry.amount.toFixed(2)}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
        </Paper>
        
        <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, borderRadius: '12px' }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>Monthly Company-Wide Salary Expenses</Typography>
            {loadingReport ? <Box sx={{display: 'flex', justifyContent: 'center'}}><CircularProgress /></Box> : 
            <TableContainer component={Paper} sx={{ borderRadius: '12px'}}>
                <Table>
                    <TableHead><TableRow><TableCell sx={{fontWeight: 'bold'}}>Month</TableCell><TableCell sx={{fontWeight: 'bold'}} align="right">Total Company Expense</TableCell></TableRow></TableHead>
                    <TableBody>
                        {companySalaryHistory.length > 0 ? companySalaryHistory.map((entry) => (
                            <TableRow key={entry.monthYear}>
                                <TableCell>{entry.monthYear}</TableCell>
                                <TableCell align="right">Rs. {entry.totalExpense.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={2} align="center">No salary data to report.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </TableContainer>}
        </Paper>
      </Box>
    </Container>
  );
};

export default SalaryManagement;
