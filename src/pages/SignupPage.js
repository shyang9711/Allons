import React, { useState, useEffect, useMemo } from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Button, Container, Typography, Box, Alert, IconButton, Grid, Snackbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate } from 'react-router-dom';
import LanguagePreferenceModel from '../models/LanguagePreferenceModel';
import NationalityModel from '../models/NationalityModel';
import '../css/SignupPage.css';
import { debounce } from 'lodash'; // Make sure to install lodash if not already installed
import axios from 'axios'; // Make sure to install axios

function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [nationality, setNationality] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [languagePreferences, setLanguagePreferences] = useState([]);
  const [errors, setErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();
  const [touched, setTouched] = useState({});
  const [phoneCountry, setPhoneCountry] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isTyping, setIsTyping] = useState({});
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@(gmail|naver)\.com$/;
    return regex.test(email);
  };

  useEffect(() => {
    if (password) {
      if (!validatePassword(password)) {
        setPasswordError('Password must contain at least 8 characters, one lowercase, one uppercase, one number, and one special character');
      } else {
        setPasswordError('');
      }
    }
  }, [password]);

  useEffect(() => {
    if (email) {
      if (!validateEmail(email)) {
        setEmailError('Email must be a Gmail or Naver address');
      } else {
        setEmailError('');
      }
    }
  }, [email]);

  const checkUsernameAvailability = async (username) => {
    try {
      const response = await axios.get(`http://localhost:5000/check-username/${username}`);
      return response.data.available;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const validateConfirmPassword = () => {
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  useEffect(() => {
    if (touched.confirmPassword) {
      validateConfirmPassword();
    }
  }, [confirmPassword, password, touched.confirmPassword]);

  // Create a debounced function to set isTyping to false
  const debouncedSetNotTyping = useMemo(
    () => debounce((field) => setIsTyping(prev => ({ ...prev, [field]: false })), 500),
    []
  );

  // Update the handleBlur function
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === 'confirmPassword') {
      validateConfirmPassword();
    }
    setIsTyping(prev => ({ ...prev, [field]: false }));
  };

  // Create a new function to handle input changes
  const handleInputChange = (field, value, setter) => {
    setter(value);
  
    // Clear the error when the user starts typing
    setErrors((prevErrors) => ({
      ...prevErrors,
      [field]: '', // Clear the error for the specific field
    }));
  
    setIsTyping(prev => ({ ...prev, [field]: true }));
    debouncedSetNotTyping(field);
  };
  

  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setPhoneNumber(input);
  
    // Clear phone error when the user starts typing
    setErrors((prevErrors) => ({
      ...prevErrors,
      phoneNumber: '', // Clear the error for the phone number
    }));
  
    setIsTyping(prev => ({ ...prev, phoneNumber: true }));
    debouncedSetNotTyping('phoneNumber');
  };

  const handleLanguagePreferenceChange = (newLanguages) => {
    setLanguagePreferences(newLanguages);
  
    // Clear language preference error when the user updates preferences
    setErrors((prevErrors) => ({
      ...prevErrors,
      languagePreferences: '', // Clear the error for the language preferences
    }));
  
    setIsTyping(prev => ({ ...prev, languagePreferences: true }));
    debouncedSetNotTyping('languagePreferences');
  };
  
  

  const validatePhoneNumber = () => {
    if (phoneCountry && phoneNumber) {
      // Simple validation: check if the number is between 7 and 15 digits
      if (phoneNumber.length < 7 || phoneNumber.length > 15) {
        setPhoneError('Invalid Phone number');
      } else {
        setPhoneError('');
      }
    }
  };

  useEffect(() => {
    validatePhoneNumber();
  }, [phoneCountry, phoneNumber]);

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('handleSubmit called');

  const newErrors = {};

  if (!username && !isTyping.username) newErrors.username = 'Username is required';
  if (!email && !isTyping.email) newErrors.email = 'Email is required';
  if (!password && !isTyping.password) newErrors.password = 'Password is required';
  if (!confirmPassword && !isTyping.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
  if (!dateOfBirth && !isTyping.dateOfBirth) newErrors.dateOfBirth = 'Date of Birth is required';
  if (!phoneNumber && !isTyping.phoneNumber) newErrors.phoneNumber = 'Phone Number is required';
  if (!gender && !isTyping.gender) newErrors.gender = 'Gender is required';
  if (languagePreferences.length === 0) newErrors.languagePreferences = 'At least one language preference is required';

  if (password !== confirmPassword && !isTyping.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
  }

  if (username && !isTyping.username && !(await checkUsernameAvailability(username))) {
    newErrors.username = 'Username is unavailable';
  }

  if (passwordError && !isTyping.password) newErrors.password = passwordError;
  if (emailError && !isTyping.email) newErrors.email = emailError;
  if (phoneError && !isTyping.phoneNumber) newErrors.phoneNumber = phoneError;

//   const isAnyFieldTyping = Object.values(isTyping).some(Boolean);

  if (Object.keys(newErrors).length === 0) {
    console.log('Attempting to send signup request');
    try {
      const response = await axios.post('http://localhost:5000/signup', {
        username,
        email,
        password,
        dateOfBirth,
        nationality,
        phoneNumber,
        gender,
        languagePreferences
      });
      console.log('Signup response:', response.data);
      setSnackbarMessage('User created successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      // Navigate to main page after successful signup
      setTimeout(() => navigate('/'), 2000); // Navigate after 2 seconds
    } catch (error) {
      console.error('Error signing up:', error.response ? error.response.data : error);
      setSnackbarMessage(error.response?.data?.message || 'Error signing up. Please try again.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  } else {
    console.log('Form has errors or is still being typed:', newErrors, 0);
    setErrors(newErrors);
  }
};
  

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  // Update the error display logic in the JSX
  const showError = (field) => touched[field] && errors[field] && !isTyping[field];

  return (
    <Container component="main" maxWidth="xs" className="signup-container">
      <IconButton
        onClick={() => navigate(-1)}
        className="back-button"
        sx={{ position: 'absolute', top: 20, left: 20 }}
      >
        <ArrowBackIcon />
      </IconButton>
      <Typography component="h1" variant="h5" className="signup-title">
        Sign Up
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => handleInputChange('username', e.target.value, setUsername)}
          onBlur={() => handleBlur('username')}
          error={!!errors.username} // Convert string to boolean
          helperText={errors.username} // Display the error message
        />
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => handleInputChange('email', e.target.value, setEmail)}
          error={!!errors.email} // Convert string to boolean
          helperText={errors.email || emailError} // Display the error message
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => handleInputChange('password', e.target.value, setPassword)}
          onBlur={() => handleBlur('password')}
          error={!!errors.password || !!passwordError}
          helperText={errors.password || passwordError}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value, setConfirmPassword)}
          onBlur={() => handleBlur('confirmPassword')}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date of Birth"
            value={dateOfBirth}
            onChange={(newValue) => {
              setDateOfBirth(newValue);
              handleInputChange('dateOfBirth', newValue, setDateOfBirth);
            }}
            renderInput={(params) => (
              <TextField 
                {...params} 
                fullWidth 
                margin="normal" 
                required 
                error={showError('dateOfBirth')}
                helperText={showError('dateOfBirth') ? errors.dateOfBirth : ''}
              />
            )}
            maxDate={maxDate}
          />
        </LocalizationProvider>
        <FormControl fullWidth margin="normal" required error={!!errors.gender}>
          <InputLabel id="gender-label">Gender</InputLabel>
          <Select
            labelId="gender-label"
            id="gender"
            value={gender}
            label="Gender"
            onChange={(e) => setGender(e.target.value)}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Select>
          {errors.gender && <Typography color="error">{errors.gender}</Typography>}
        </FormControl>
        <Grid container spacing={2}>
          <Grid item xs={5}>
            <NationalityModel
              nationality={phoneCountry}
              setNationality={setPhoneCountry}
              label="Country Code"
              error={!!errors.phoneCountry}
              helperText={errors.phoneCountry}
            />
          </Grid>
          <Grid item xs={7}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="phoneNumber"
              label="Phone Number"
              name="phoneNumber"
              autoComplete="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              error={!!errors.phoneNumber || !!phoneError}
              helperText={errors.phoneNumber || phoneError}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
          </Grid>
        </Grid>
        <LanguagePreferenceModel
          languages={languagePreferences} 
          setLanguages={setLanguagePreferences}
          profile={false}
          onAddLanguage={null}
          onRemoveLanguage={null}
        />
        {errors.languagePreferences && (
          <Alert severity="error" sx={{ mt: 2 }}>{errors.languagePreferences}</Alert>
        )}
        <NationalityModel
          nationality={nationality}
          setNationality={setNationality}
          label="Nationality"
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          className="submit-button"
        >
          Sign Up
        </Button>
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SignupPage;
