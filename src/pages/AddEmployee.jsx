
import React, { useState } from 'react';
import { ref, push, set } from 'firebase/database';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
    Container, TextField, Button, Typography, Box, Paper, Grid, Alert,
} from '@mui/material';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const AddEmployee = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        indexNo: '',
        joiningDate: '',
        idNumber: '',
        fullName: '',
        whatsappNumber: '',
        googleFormFilledDate: '',
        address: '',
        bankHolderName: '',
        accountNumber: '',
        bankName: '',
        branch: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const validateForm = () => {
        const requiredFields = ['indexNo', 'joiningDate', 'idNumber', 'fullName', 'whatsappNumber', 'address'];
        for (const field of requiredFields) {
            if (!formData[field]) {
                // Convert camelCase to Title Case for display
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                setError(`${fieldName} is required.`);
                return false;
            }
        }
        setError('');
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        const employeesRef = ref(db, 'employees');
        const newEmployeeRef = push(employeesRef);

        set(newEmployeeRef, formData)
            .then(() => {
                Swal.fire('Success', 'Employee added successfully!', 'success');
                navigate('/');
            })
            .catch(error => {
                console.error("Error adding employee: ", error);
                Swal.fire('Error', 'Failed to add employee.', 'error');
            })
            .finally(() => {
                setLoading(false);
            });
    };
    
    const handleFileUpload = (e) => {
        const reader = new FileReader();
        reader.readAsBinaryString(e.target.files[0]);
        reader.onload = (e) => {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(sheet, { cellDates: true });
          
          try {
            const employeesRef = ref(db, 'employees');
            parsedData.forEach(emp => {
                const employeeToSave = { ...emp };

                // Validate and format specific fields
                if (emp.joiningDate instanceof Date) {
                    employeeToSave.joiningDate = emp.joiningDate.toISOString().split('T')[0];
                }
                if (emp.googleFormFilledDate instanceof Date) {
                    employeeToSave.googleFormFilledDate = emp.googleFormFilledDate.toISOString().split('T')[0];
                }

                const newEmployeeRef = push(employeesRef);
                set(newEmployeeRef, employeeToSave);
            });
            Swal.fire('Success', 'Employees uploaded successfully!', 'success');
            navigate('/');
          } catch (uploadError) {
            console.error("Error uploading employees: ", uploadError);
            Swal.fire('Error', 'An error occurred while saving the employees to the database.', 'error');
          }
        };
      };

    return (
        <Container maxWidth="md">
            <Paper sx={{ mt: 4, p: { xs: 2, sm: 3, md: 4 }, borderRadius: '12px' }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    Add New Employee
                </Typography>
                <Box sx={{mb: 2, textAlign: 'center'}}>
                  <Typography variant="subtitle1" color="text.secondary">Or upload an Excel file with employee data</Typography>
                  <Button component="label" variant="outlined" sx={{mt: 1}}>
                    Upload File
                    <input type="file" hidden onChange={handleFileUpload} accept=".xlsx, .xls"/>
                  </Button>
                </Box>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
                        
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Index No" name="indexNo" value={formData.indexNo} onChange={handleChange} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Joining Date" name="joiningDate" type="date" InputLabelProps={{ shrink: true }} value={formData.joiningDate} onChange={handleChange} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="ID Number" name="idNumber" value={formData.idNumber} onChange={handleChange} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="WhatsApp Number" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleChange} required /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Google Form Filled Date" name="googleFormFilledDate" type="date" InputLabelProps={{ shrink: true }} value={formData.googleFormFilledDate} onChange={handleChange} /></Grid>
                        <Grid item xs={12}><TextField fullWidth label="Address" name="address" multiline rows={3} value={formData.address} onChange={handleChange} required /></Grid>
                        
                        <Grid item xs={12}><Typography variant="h6" sx={{mt: 2}}>Bank Details</Typography></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Bank Holder Name" name="bankHolderName" value={formData.bankHolderName} onChange={handleChange} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} /></Grid>
                        <Grid item xs={12} sm={6}><TextField fullWidth label="Branch" name="branch" value={formData.branch} onChange={handleChange} /></Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Employee'}
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Container>
    );
};

export default AddEmployee;
