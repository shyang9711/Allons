import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  IconButton,
  Drawer,
  AppBar,
  Toolbar,
  ListItemButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import MenuModel from '../models/MenuModel';
import LanguagePreferenceModel from '../models/LanguagePreferenceModel';
import '../css/ProfilePage.css';
import { Lan } from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [languagePreferences, setLanguagePreferences] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const navigate = useNavigate();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const { username } = useParams();
  const [userPosts, setUserPosts] = useState([]);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [username]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('userToken');
        console.log('Fetching posts for user:', username);
        const response = await axios.get(`http://localhost:5000/api/posts/user/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Received response:', response.data);
        setUserPosts(response.data);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        console.error('Error response:', err.response?.data);
        setError(err.response?.data?.details || err.message || 'Failed to load user posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUserPosts();
    }
  }, [username]);

  useEffect(() => {
    if (currentUser && username) {
      setIsOwnProfile(currentUser.username === username);
    }
  }, [currentUser, username]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    navigate('/');
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`http://localhost:5000/profile/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setNewEmail(response.data.email);
      setLanguagePreferences(response.data.language_preferences || []);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response) {
        if (error.response.status === 401 && error.response.data.error === 'Token expired') {
          localStorage.removeItem('userToken');
          setSnackbarMessage('Your session has expired. Please log in again.');
          setSnackbarSeverity('warning');
          setOpenSnackbar(true);
          navigate('/login');
        } else if (error.response.status === 403 || error.response.status === 404) {
          setSnackbarMessage('Unable to load profile. Please try again.');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
        } else if (error.response.status === 500) {
          setSnackbarMessage('Server error. Please try again later.');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
          console.error('Server error details:', error.response.data);
        }
      } else {
        setSnackbarMessage('An error occurred. Please try again.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
      setUser(null); // Set user to null if there's an error
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
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

  const handleUpdateEmail = async () => {
    if (newEmail === user.email) {
      setSnackbarMessage('New email is the same as the current email');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    try {
      const token = localStorage.getItem('userToken');
      await axios.put('http://localhost:5000/profile/email', { email: newEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage('Email updated successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      fetchUserProfile();
    } catch (error) {
      if (error.response && error.response.data.error === 'Email already in use') {
        setSnackbarMessage('Email is already in use');
      } else {
        setSnackbarMessage('Failed to update email');
      }
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleUpdatePassword = async () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setSnackbarMessage('Password must contain at least 1 uppercase, 1 lowercase, 1 number, 1 special character and be at least 8 characters long');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    try {
      const token = localStorage.getItem('userToken');
      await axios.put('http://localhost:5000/profile/password', { password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage('Password updated successfully');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setNewPassword('');
    } catch (error) {
      setSnackbarMessage('Failed to update password');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleAddLanguage = async (newLanguage) => {
    if (!newLanguage.trim()) return;
    try {
      const token = localStorage.getItem('userToken');
      await axios.post('http://localhost:5000/profile/languages', { language: newLanguage }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage('Language preference added');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      fetchUserProfile();
    } catch (error) {
      console.error('Error adding language:', error);
      let errorMessage = 'Failed to add language preference';
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message;
      }
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleRemoveLanguage = async (language) => {
    if (languagePreferences.length <= 1) {
      setSnackbarMessage('You must have at least one language preference');
      setSnackbarSeverity('warning');
      setOpenSnackbar(true);
      return;
    }
    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`http://localhost:5000/profile/languages/${encodeURIComponent(language)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage('Language preference removed');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      fetchUserProfile();
    } catch (error) {
      console.error('Error removing language:', error);
      let errorMessage = 'Failed to remove language preference';
      if (error.response) {
        errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response received from server';
      } else {
        errorMessage = error.message;
      }
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('userToken');
      // Attempt to delete the account on the server
      await axios.delete('http://localhost:5000/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSnackbarMessage('Account deleted successfully');
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error deleting account:', error);
      setSnackbarMessage('Failed to delete account on server, but proceeding with local logout');
      setSnackbarSeverity('warning');
    } finally {
      // Regardless of server response, proceed with logout and redirection
      localStorage.removeItem('userToken');
      setIsLoggedIn(false);
      setOpenSnackbar(true);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5">
            Error loading profile
          </Typography>
          <Button onClick={() => navigate('/login')}>Return to Login</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container className="profile-page">
      <AppBar position="static" className="app-bar">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} className="back-button">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Profile
          </Typography>
          <IconButton edge="end" color="inherit" onClick={() => setIsMenuOpen(true)} className="menu-button">
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="xs" className="profile-content">
        <Box className="profile-section">
          <List>
            <ListItem>
              <ListItemText primary="First Name" secondary={user.first_name} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Last Name" secondary={user.last_name} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Username" secondary={user.username} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Email" secondary={user.email} />
            </ListItem>
          </List>
          {isOwnProfile && (
            <>
              <div className="input-with-button">
                <TextField
                  required
                  fullWidth
                  id="newEmail"
                  label="New Email"
                  name="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <Button onClick={handleUpdateEmail} variant="contained">Update</Button>
              </div>
              <div className="input-with-button">
                <TextField
                  required
                  fullWidth
                  id="newPassword"
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button onClick={handleUpdatePassword} variant="contained">Update</Button>
              </div>
            </>
          )}
        </Box>
        {isOwnProfile? (
          <Box className="profile-section">
            <LanguagePreferenceModel
            languages={languagePreferences} 
            setLanguages={setLanguagePreferences}
            onAddLanguage={handleAddLanguage}
            onRemoveLanguage={handleRemoveLanguage}
            />
          </Box>
        ): ( 
          <>
            <Typography variant="h6" gutterBottom>Preferred Languages : </Typography>
            <List>
              {languagePreferences.map((language) => (
              <ListItem key={language}>{language}</ListItem>
            ))}
            </List>
          </>
        )}
        {isOwnProfile && (
          <Box className="profile-section">
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </Box>
        )}
      </Container>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Account"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete your account? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <MenuModel 
        isOpen={isMenuOpen} 
        onClose={toggleMenu} 
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        username={currentUser?.username}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Typography variant="h6" gutterBottom>Posts Joined:</Typography>
      {loading ? (
        <CircularProgress />
      ) : userPosts.length > 0 ? (
        <List>
          {userPosts.map((post) => (
            <ListItem key={post.id} component={Link} to={`/post/${post.id}`}>
              <ListItemText 
                primary={post.title} 
                secondary={new Date(post.date_time).toLocaleString()} 
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">
          {error ? 'Error loading posts.' : "This user hasn't joined any posts yet."}
        </Typography>
      )}
    </Container>
  );
}

export default ProfilePage;
