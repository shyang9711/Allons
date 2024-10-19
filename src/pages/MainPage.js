import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton, Drawer, List, ListItem, ListItemText, AppBar, Toolbar, Typography, Container, TextField } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import MenuModel from '../models/MenuModel';
import MapModel from '../models/MapModel';
import '../css/MainPage.css';

const MainPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <Container className="main-page">
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} className="title">
            Allons
          </Typography>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={() => setIsMenuOpen(true)}
            className="menu-button"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <MenuModel 
        isOpen={isMenuOpen} 
        onClose={toggleMenu} 
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
      />

      <div className="date-selection">
        <div className="date-picker-container">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              renderInput={(params) => <TextField {...params} />}
              minDate={new Date()}
            />
          </LocalizationProvider>
        </div>

        <MapModel isDraggable={false}/>
      </div>
    </Container>
  );
};

export default MainPage;
