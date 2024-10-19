import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { Button, TextField, Typography, Container, Box, Select, MenuItem, FormControl, InputLabel, Grid, AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
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
  const [title, setTitle] = useState('');
  const [genderPreference, setGenderPreference] = useState('');
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [languages, setLanguages] = useState([]);
  const [groupSize, setGroupSize] = useState(2);
  const [itinerary, setItinerary] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Generate options for group size
  const groupSizeOptions = [...Array(19).keys()].map(i => i + 2);

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleBackClick = () => {
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMapClick = (latlng) => {
    setLocation(latlng);
  };

  const handleHostClick = async () => {
    // Assuming we have a way to get the current user
    const currentUser = getCurrentUser();

    const groupPost = new GroupPost(
      currentUser,
      title,
      genderPreference,
      ageRange,
      groupSize,
      itinerary,
      dateTime,
      location
    );

    try {
      await saveGroupPost(groupPost);
      // Show success message or navigate to a new page
      console.log('Group post saved successfully');
      navigate('/'); // Navigate to home page or group details page
    } catch (error) {
      console.error('Error saving group post:', error);
      // Show error message to the user
    }
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

      <MenuModel isOpen={isMenuOpen} onClose={toggleMenu} isLoggedIn={isLoggedIn} />

      <Box className="map-container" mb={3}>
        <MapModel onMapClick={handleMapClick} />
      </Box>

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>Title</Typography>
        <TextField
          fullWidth
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of your post (Ex. Today/Paris/Dinner and Eiffel Tower Sightseeing)"
        />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <GenderPreferenceMode 
            genderPreference={genderPreference} 
            setGenderPreference={setGenderPreference} 
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <AgeRangeModel 
            ageRange={ageRange} 
            setAgeRange={setAgeRange} 
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Typography variant="h6" gutterBottom>Group Size</Typography>
          <FormControl fullWidth>
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
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <LanguagePreferenceModel 
            languages={languages} 
            setLanguages={setLanguages} 
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>Date and Time</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              value={dateTime}
              onChange={(newValue) => setDateTime(newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
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
