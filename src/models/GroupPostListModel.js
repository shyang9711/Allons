import React, { useState, useEffect, useCallback, useRef } from 'react';
import { List, ListItemButton, ListItemText, Typography } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const GroupPostList = ({ date, mapBounds, onPostsUpdate }) => {
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevMapBoundsRef = useRef();
  const prevDateRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('userToken');

      if (!token) {
        console.error('No token found in localStorage');
        setError('No authentication token found. Please log in.');
        setIsLoading(false);
        return;
      }

      // Check if mapBounds is null or undefined
      if (!mapBounds) {
        console.error('Map bounds are not set');
        setError('Map bounds are not set. Please try again later.');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching posts for date:', date.toISOString());
        console.log('Map bounds:', JSON.stringify(mapBounds));

        const response = await axios.get('http://localhost:5000/api/group_posts', {
          params: {
            date: date.toISOString(),
            bounds: JSON.stringify(mapBounds)
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Response status:', response.status);
        console.log('Response data:', response.data);

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format');
        }

        const filteredPosts = response.data.filter(post => {
          const postDate = new Date(post.date_time);
          return postDate.toDateString() === date.toDateString();
        });

        console.log('Filtered posts:', filteredPosts);

        setPosts(filteredPosts);
        onPostsUpdate(filteredPosts);
        prevMapBoundsRef.current = mapBounds;
        prevDateRef.current = date;
      } catch (err) {
        console.error('Error fetching posts:', err);
        if (err.response) {
          console.error('Error response:', err.response.status, err.response.data);
          setError(`Failed to load posts. Server responded with: ${err.response.status} ${err.response.statusText}`);
        } else if (err.request) {
          console.error('No response received:', err.request);
          setError('Failed to load posts. No response received from server.');
        } else {
          console.error('Error details:', err.message);
          setError(`Failed to load posts. ${err.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [date, mapBounds, onPostsUpdate]);

  // Helper function to check if two objects are equal
  function isEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <div className="group-post-list">
      <Typography variant="h6">Group Posts for {date.toDateString()}</Typography>
      {isLoading ? (
        <Typography>Loading posts...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : posts.length === 0 ? (
        <Typography>No posts found for this date and location.</Typography>
      ) : (
        <List>
          {posts.map((post) => (
            <ListItemButton
            key={post.id}
            onClick={() => handlePostClick(post.id)}>
              <ListItemText 
                primary={post.title}
                secondary={`Host: ${post.host_username} - ${new Date(post.date_time).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </div>
  );
};

export default GroupPostList;
