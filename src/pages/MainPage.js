import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button, IconButton, Drawer, List, ListItem, ListItemText, AppBar, Toolbar, Typography, Container, TextField } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import MenuModel from '../models/MenuModel';
import MapModel from '../models/MapModel';
import GroupPostList from '../models/GroupPostListModel';
import '../css/MainPage.css';
import axios from 'axios';

const MainPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const [mapBounds, setMapBounds] = useState(null);
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const location = useLocation();
  const [allHeritexData, setAllHeritexData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);

    // Add this part to handle token expiration or removal
    const checkLoginStatus = () => {
      const currentToken = localStorage.getItem('userToken');
      if (!currentToken && isLoggedIn) {
        setIsLoggedIn(false);
      }
    };

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

    fetchUserProfile();
  }, [isLoggedIn]);

  useEffect(() => {
    if (location.state && location.state.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  useEffect(() => {
    const fetchHeritexData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('userToken');
        if (!token) {
          console.error('No authentication token found');
          setIsLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/api/heritex', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Fetched Heritex data:', response.data);
        setAllHeritexData(response.data);
      } catch (error) {
        console.error('Error fetching Heritex data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeritexData();
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
        username={currentUser?.username}
      />

      <div className="date-selection">
        <div className="date-picker-container">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              value={selectedDate}
              onChange={(newDate) => setSelectedDate(newDate)}
              renderInput={(params) => <TextField {...params} />}
              minDate={new Date()}
            />
          </LocalizationProvider>
        </div>

        <MapModel 
          isDraggable={false}
          onBoundsChange={setMapBounds}
          groupPostList={posts}
          selectedDate={selectedDate}
          heritexLocations={allHeritexData}
          allHeritexData={allHeritexData}
          isLoading={isLoading}
        />

        {mapBounds && (
          <>
            <GroupPostList 
              date={selectedDate}
              mapBounds={mapBounds}
              onPostsUpdate={setPosts}
            />
          </>
        )}
      </div>

      {message && <div className="alert alert-warning">{message}</div>}
    </Container>
  );
};

export default MainPage;
