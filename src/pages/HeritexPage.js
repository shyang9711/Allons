import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Container, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import MenuModel from '../models/MenuModel';
import HeritexDisplayModel from '../models/HeritexDisplayModel';
import axios from 'axios';
// Add this line to import the CSS file
import '../css/HeritexPage.css';

const HeritexPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [boxCount, setBoxCount] = useState(0);
    const [userHeritex, setUserHeritex] = useState({});
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedHeritex, setSelectedHeritex] = useState(null);
    const navigate = useNavigate();
    const [allHeritex, setAllHeritex] = useState([]);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        checkTokenExpiration();
        if (!sessionExpired) {
            fetchUserHeritex();
            fetchAllHeritex();
            fetchUserProfile();
        }
    }, [sessionExpired]);

    const checkTokenExpiration = () => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            handleSessionExpired();
        }
        else {
            setIsLoggedIn(true);
        }
        // Add additional token expiration check if needed
    };

    const handleSessionExpired = () => {
        localStorage.removeItem('userToken');
        setIsLoggedIn(false);
        setSessionExpired(true);
        navigate('/', { state: { message: 'Login session expired. Please log in again.' } });
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

    const fetchUserHeritex = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch('http://localhost:5000/api/user/heritex', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUserHeritex(typeof data === 'object' && data !== null ? data : {});
            } else if (response.status === 401) {
                handleSessionExpired();
            } else {
                console.error('Failed to fetch user Heritex data');
                setUserHeritex({});
            }
        } catch (error) {
            console.error('Error fetching user Heritex data:', error);
            setUserHeritex({});
        }
    };

    const fetchAllHeritex = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch('http://localhost:5000/api/heritex', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setAllHeritex(data);
            } else if (response.status === 401) {
                handleSessionExpired();
            } else {
                console.error('Failed to fetch all Heritex data');
            }
        } catch (error) {
            console.error('Error fetching all Heritex data:', error);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('userToken');
        setIsLoggedIn(false);
        navigate('/');
    };

    const handleHeritexClick = (heritex) => {
        setSelectedHeritex(heritex);
    };

    const handleCloseDialog = () => {
        setSelectedHeritex(null);
    };

    if (sessionExpired) {
        return null; // Render nothing if session has expired
    }

    return (
        <Container className="heritex-page">
            <AppBar position="static" className="app-bar">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="back"
                        onClick={() => navigate(-1)}
                        className="back-button"
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>
                        Heritex
                    </Typography>
                    <IconButton
                        edge="end"
                        color="inherit"
                        aria-label="menu"
                        onClick={() => {setIsMenuOpen(true)}}
                        className="menu-button"
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            
            <MenuModel 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                isLoggedIn={isLoggedIn}
                handleLogout={handleLogout}
                username={currentUser?.username}
            />

            <HeritexDisplayModel 
                allHeritex={allHeritex}
                userHeritex={userHeritex}
                onHeritexClick={handleHeritexClick}
            />

            <Dialog open={!!selectedHeritex} onClose={handleCloseDialog}>
                {selectedHeritex && (
                    userHeritex[selectedHeritex.id] ? (
                        <>
                            <DialogTitle>{selectedHeritex.name}</DialogTitle>
                            <DialogContent>
                                <Typography>Countries: {selectedHeritex.countries.join(', ')}</Typography>
                                <Typography>Type: {selectedHeritex.type}</Typography>
                                <Typography>Obtained: {new Date(userHeritex[selectedHeritex.id]).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Typography>
                                <Typography>Rarity: {selectedHeritex.rarity}</Typography>
                            </DialogContent>
                        </>
                    ) : (
                        <>
                            <DialogTitle>???</DialogTitle>
                            <DialogContent>
                                <Typography>You have yet to explore this heritage.</Typography>
                            </DialogContent>
                        </>
                    )
                )}
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default HeritexPage;
