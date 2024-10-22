import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Container, Typography, Button, CircularProgress, Box, List, ListItem, 
  ListItemText, AppBar, Toolbar, IconButton, Modal
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';
import MenuModel from '../models/MenuModel';
import '../css/ViewPostPage.css';

const ViewPostPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserInPost, setIsUserInPost] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { postId } = useParams();
  const navigate = useNavigate();

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`http://localhost:5000/api/group_posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPost(response.data);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err.response?.data?.error || 'Failed to load post. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const askToJoin = async () => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`http://localhost:5000/api/group_posts/${postId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPost(); // Refresh the post data
    } catch (err) {
      console.error('Error asking to join:', err);
      setError(err.response?.data?.error || 'Failed to ask to join. Please try again later.');
    }
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useEffect(() => {
    if (post && currentUser) {
      setIsUserInPost(post.user_ids.some(postUser => postUser.user_id === currentUser.user_id));
    }
  }, [post, currentUser]);

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    navigate('/');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={fetchPost}>Retry</Button>
        <Button variant="outlined" onClick={() => navigate(-1)} style={{ marginLeft: '10px' }}>Back to List</Button>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container>
        <Typography variant="h6">Post not found</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Back to List</Button>
      </Container>
    );
  }

  return (
    <Container className="view-post-page">
      <>
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
            <Typography variant="h6" component="div" className="title">
              View Post
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={toggleMenu}
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
        <Container sx={{ mt: 2 }}>
          <Typography variant="h4" gutterBottom>{post.title}</Typography>
          <Typography variant="subtitle1">
            Host: {post.host_first_name} {post.host_last_name} ({post.host_username})
          </Typography>
          <Typography variant="subtitle1">Date: {new Date(post.date_time).toLocaleString()}</Typography>
          <Typography variant="body1" paragraph>{post.description}</Typography>
          
          <Typography variant="h6" gutterBottom>Participants:</Typography>
          {post.users && post.users.length > 0 ? (
            <List>
              {post.users.map((user) => (
                <ListItem key={user.user_id} component={Link} to={`/profile/${user.username}`}>
                  <ListItemText primary={`${user.first_name} ${user.last_name} (${user.username})`} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body1">No participants yet.</Typography>
          )}
          
          {currentUser && !isUserInPost && (
            <Button variant="contained" color="primary" onClick={askToJoin} sx={{ mr: 1, mt: 2 }}>
              Ask to Join
            </Button>
          )}
        </Container>
      </>
    </Container>
  );
};

export default ViewPostPage;
