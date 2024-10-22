import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';  // Add this import
import 'leaflet/dist/leaflet.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { Button, TextField, Typography, Container, Box, Select, MenuItem, FormControl, InputLabel, Grid, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText, FormHelperText } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import MapModel from '../models/MapModel';
import GenderPreferenceMode from '../models/GenderPreferenceModel';
import AgeRangeModel from '../models/AgeRangeModel';
import LanguagePreferenceModel from '../models/LanguagePreferenceModel';
import '../css/HostGroupPage.css';
import GroupPost from '../classes/GroupPost';
// import { saveGroupPost } from '../services/databaseService';
import MenuModel from '../models/MenuModel';

function HostGroupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [genderPreference, setGenderPreference] = useState('');
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [groupSize, setGroupSize] = useState(2);
  const [itinerary, setItinerary] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [defaultLocation, setDefaultLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // San Francisco
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [languagePreferences, setLanguagePreferences] = useState([]);
  const [currentUserLanguages, setCurrentUserLanguages] = useState([]);
  const [userChangedLocation, setUserChangedLocation] = useState(false);

  // Generate options for group size
  const groupSizeOptions = [...Array(19).keys()].map(i => i + 2);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    setCurrentUser(null);
    navigate('/', { state: { message: 'Your login session has expired. Please log in again.' } });
  };

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    // Get user's current location or use default
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          setLocation(defaultLocation);
        }
      );
    } else {
      setLocation(defaultLocation);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('userToken');
    console.log('Token:', token);
    if (token) {
      try {
        console.log('Fetching user profile...');
        const response = await axios.get('http://localhost:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Profile response:', response.data);
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('userToken');
          setIsLoggedIn(false);
        }
      }
    }
  };

  const handleBackClick = () => {
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMapClick = (latlng) => {
    setLocation(latlng);
  };

  const handleLocationSearch = (searchedLocation) => {
    setUserChangedLocation(true);
    setLocation(searchedLocation);
  };

  const validateForm = () => {
    const newErrors = {};
    if (title.replace(/[^a-zA-Z0-9]/g, '').length < 8) {
      newErrors.title = 'Title must be at least 8 characters long (excluding spaces and special characters)';
    }
    if (!genderPreference) {
      newErrors.genderPreference = 'Please select a gender preference';
    }
    if (!ageRange || ageRange.length !== 2) {
      newErrors.ageRange = 'Please select an age range';
    }
    if (!groupSize) {
      newErrors.groupSize = 'Please select a group size';
    }
    if (!dateTime) {
      newErrors.dateTime = 'Please select a date and time';
    }
    if (itinerary.replace(/[^a-zA-Z0-9]/g, '').length < 25) {
      newErrors.itinerary = 'Itinerary must be at least 25 characters long (excluding spaces and special characters)';
    }
    if (languagePreferences.length === 0) {
      newErrors.languages = 'Please select at least one language';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHostClick = async () => {
    console.log('Host button clicked');

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    if (!currentUser) {
      console.error('User is not logged in');
      setErrors({ submit: 'User is not logged in. Please log in and try again.' });
      return;
    }

    if (!location) {
      console.error('Location is not selected');
      setErrors({ submit: 'Please select a location for the group.' });
      return;
    }

    // Convert groupSize to a number, or use a large number for "20+"
    const numericGroupSize = groupSize === "20+" ? 9999 : parseInt(groupSize, 10);

    const groupPost = {
      title: title,
      gender_preference: genderPreference,
      language_preference: languagePreferences.join(','),
      age_range_min: ageRange[0],
      age_range_max: ageRange[1],
      group_size: numericGroupSize,
      itinerary: itinerary,
      date_time: dateTime instanceof Date ? dateTime.toISOString() : new Date(dateTime).toISOString(),
      location: `${location.lat},${location.lng}`,
    };

    try {
      const token = localStorage.getItem('userToken');
      console.log('Token from localStorage:', token);

      if (!token) {
        console.error('No token found in localStorage');
        // Handle the case where there's no token (e.g., redirect to login)
        return;
      }

      // Create the group post
      const response = await axios.post('http://localhost:5000/group_posts', groupPost, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Group post saved successfully:', response.data);

      // If successful, navigate to the main page
      navigate('/');
    } catch (error) {
      console.error('Error saving group post:', error.response?.data || error.message);
      console.log('Full error object:', error);
      setErrors({ submit: 'An error occurred while saving the group post. Please try again.' });
    }
  };

  const handleAddLanguage = (language) => {
    if (!languagePreferences.includes(language)) {
      setLanguagePreferences([...languagePreferences, language]);
    }
  };

  const handleRemoveLanguage = (language) => {
    setLanguagePreferences(languagePreferences.filter(lang => lang !== language));
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    console.log('New location:', newLocation);
  };

  const handleMapMove = () => {
    setUserChangedLocation(true);
  };

  return (
    <Container className="host-group-page">
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="back" className="back-button" onClick={handleBackClick}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" className="title">
            Host Group
          </Typography>
          <IconButton edge="end" color="inherit" aria-label="menu" className="menu-button" onClick={toggleMenu}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <MenuModel 
        isOpen={isMenuOpen} 
        onClose={toggleMenu} 
        isLoggedIn={isLoggedIn} 
        username={currentUser?.username}
      />

      <Box className="map-container" mb={3}>
        <MapModel 
          onLocationChange={handleLocationChange} 
          isDraggable={true}
          onMapMove={handleMapMove}
          onLocationSearch={handleLocationSearch}
        />
      </Box>

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>Title</Typography>
        <TextField
          fullWidth
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of your post (Ex. Today/Paris/Dinner and Eiffel Tower Sightseeing)"
          error={!!errors.title}
          helperText={errors.title}
        />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <GenderPreferenceMode 
            genderPreference={genderPreference} 
            setGenderPreference={setGenderPreference}
            error={!!errors.genderPreference}
            helperText={errors.genderPreference}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <AgeRangeModel 
            ageRange={ageRange} 
            setAgeRange={setAgeRange}
            error={!!errors.ageRange}
            helperText={errors.ageRange}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Typography variant="h6" gutterBottom>Group Size</Typography>
          <FormControl fullWidth error={!!errors.groupSize}>
            <InputLabel id="group-size-label">Select group size</InputLabel>
            <Select
              labelId="group-size-label"
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
              label="Select group size"
            >
              {groupSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
              <MenuItem value="20+">20+</MenuItem>
            </Select>
            {errors.groupSize && <FormHelperText>{errors.groupSize}</FormHelperText>}
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        

        <Grid item xs={12} sm={6}>
          <LanguagePreferenceModel 
            languages={languagePreferences} 
            setLanguages={setLanguagePreferences}
            onAddLanguage={handleAddLanguage}
            onRemoveLanguage={handleRemoveLanguage}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>Date and Time</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              value={dateTime}
              onChange={(newValue) => setDateTime(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  error={!!errors.dateTime}
                  helperText={errors.dateTime}
                />
              )}
              minDate={new Date()}
              maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>Itinerary</Typography>
        <TextField
          fullWidth
          multiline
          rows={5}
          value={itinerary}
          onChange={(e) => setItinerary(e.target.value)}
          placeholder="Write your itinerary here..."
          error={!!errors.itinerary}
          helperText={errors.itinerary}
        />
      </Box>

      <Box display="flex" justifyContent="center" mb={3}>
        <Button variant="contained" color="primary" onClick={handleHostClick}>
          Host
        </Button>
      </Box>
    </Container>
  );
}

export default HostGroupPage;
