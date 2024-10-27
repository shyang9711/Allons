import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Container, Typography, Button, CircularProgress, Box, List, ListItem, 
  ListItemText, AppBar, Toolbar, IconButton, Modal, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Collapse, Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import axios from 'axios';
import MenuModel from '../models/MenuModel';
import MapModel from '../models/MapModel';
import '../css/ViewPostPage.css';

const ViewPostPage = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isUserInPost, setIsUserInPost] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isRequestsExpanded, setIsRequestsExpanded] = useState(false);
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [location, setLocation] = useState(null);
  const [initialLocation, setInitialLocation] = useState(null);
  const [userChangedLocation, setUserChangedLocation] = useState(false);
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

  const leavePost = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.post(`http://localhost:5000/api/group_posts/${postId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.message.includes('Post was deleted')) {
        // Post was deleted, navigate back to the list or home page
        navigate('/'); // or wherever you want to redirect
      } else {
        // Post still exists, just refresh the data
        fetchPost();
      }
    } catch (err) {
      console.error('Error leaving post:', err);
      setError(err.response?.data?.error || 'Failed to leave the post. Please try again later.');
    }
  };

  const handleRequest = async (userId, action) => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`http://localhost:5000/api/group_posts/${postId}/handle-request`, 
        { userId, action }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPost(); // Refresh the post data
    } catch (err) {
      console.error('Error handling request:', err);
      setError(err.response?.data?.error || 'Failed to handle the request. Please try again later.');
    }
  };

  const navigateToUserProfile = (username) => {
    console.log("Navigating to profile of:", username);
    navigate(`/profile/${username}`);
  };

  const withdrawRequest = async () => {
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`http://localhost:5000/api/group_posts/${postId}/withdraw-request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPost(); // Refresh the post data
    } catch (err) {
      console.error('Error withdrawing request:', err);
      setError(err.response?.data?.error || 'Failed to withdraw request. Please try again later.');
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
      setIsUserInPost(post.user_ids.includes(currentUser.user_id));
      setIsHost(post.host_user_id === currentUser.user_id);
      // Check if the current user has already requested to join
      setHasRequested(post.requests.some(request => request.user_id === currentUser.user_id));
    }
  }, [post, currentUser]);

  useEffect(() => {
    // Check if user is logged in (e.g., by checking for a token in localStorage)
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (post && post.location) {
      const [lat, lng] = post.location.split(',').map(Number);
      setLocation([lat, lng]);
      setInitialLocation([lat, lng]);
    }
  }, [post]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleEditPost = () => {
    navigate(`/edit-post/${postId}`);
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
    setUserChangedLocation(true);
  };

  const handleMapMove = () => {
    setUserChangedLocation(true);
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
            {isHost && (
              <IconButton
                color="inherit"
                aria-label="edit"
                onClick={handleEditPost}
                className="edit-button"
              >
                <EditIcon />
              </IconButton>
            )}
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
            Host: {post.host_first_name} {post.host_last_name}
          </Typography>
          <Typography variant="subtitle1">Date: {new Date(post.date_time).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Typography>
          <Typography variant="body1" paragraph>{post.itinerary}</Typography>
          
          {location && (
            <Box className="map-container" mb={3} height={500}>
            <MapModel 
              onLocationChange={handleLocationChange} 
              isDraggable={false}
              onMapMove={handleMapMove}
              initialLocation={initialLocation}
            />
            </Box>
          )}

          {isHost && post && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsRequestsExpanded(!isRequestsExpanded)}
                startIcon={isRequestsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ mt: 2, mb: 1 }}
              >
                Requests ({post.requests?.length || 0})
              </Button>
              <Collapse in={isRequestsExpanded}>
                {!post.requests || post.requests.length === 0 ? (
                  <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>No requests yet</Typography>
                ) : (
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {post.requests.map((request) => (
                          <TableRow key={request.user_id}>
                            <TableCell>
                              <Button
                                onClick={() => navigateToUserProfile(request.username)}
                              >
                                {request.first_name} {request.last_name}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <Button onClick={() => handleRequest(request.user_id, 'accept')}>Accept</Button>
                              <Button onClick={() => handleRequest(request.user_id, 'reject')}>Reject</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Collapse>
            </>
          )}
          
          {post && post.users && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
                startIcon={isParticipantsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ mt: 2, mb: 1 }}
              >
                Participants ({post.users.length})
              </Button>
              <Collapse in={isParticipantsExpanded}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Gender</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {post.users.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <Button
                              onClick={() => navigateToUserProfile(user.username)}
                            >
                              {user.first_name} {user.last_name}
                              {user.user_id === post.host_user_id && (
                                <Chip label="Host" color="primary" size="small" sx={{ ml: 1 }} />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>{user.age}</TableCell>
                          <TableCell>{user.gender}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </>
          )}
          {currentUser && post && (
            post.user_ids.includes(currentUser.user_id)? (
              (post.user_ids.length > 1?

                <Button variant="contained" color="secondary" onClick={leavePost} sx={{ mt: 2 }}>
                  Leave Post
                </Button>
                :
                null
              )
            ) : hasRequested ? (
              <Button variant="contained" color="warning" onClick={withdrawRequest} sx={{ mt: 2 }}>
                Withdraw Request
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={askToJoin} sx={{ mt: 2 }}>
                Ask to Join
              </Button>
            )
          )}
          
          {isHost && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEditPost}
              sx={{ mt: 2 }}
            >
              Edit Post
            </Button>
          )}
        </Container>
      </>
    </Container>
  );
};

export default ViewPostPage;
