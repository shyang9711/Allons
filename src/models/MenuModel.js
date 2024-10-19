import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, ListItemButton } from '@mui/material';
import { Home, Login, AccountCircle, ExitToApp, PersonAdd, GroupAdd, Settings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MenuModel = ({ isOpen, onClose, isLoggedIn, handleLogout }) => {
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    ...(isLoggedIn
      ? [
          { text: 'Host Group', icon: <GroupAdd />, path: '/hostgroup' },
          { text: 'Profile', icon: <AccountCircle />, path: '/profile' },
          { text: 'Settings', icon: <Settings />, path: '/settings' },
          { text: 'Logout', icon: <ExitToApp />, onClick: handleLogout },
        ]
      : [
          { text: 'Login', icon: <Login />, path: '/login' },
          { text: 'Signup', icon: <PersonAdd />, path: '/signup' },
          { text: 'Settings', icon: <Settings />, path: '/settings' },
        ]),
  ];

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  };

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      <List>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.text}>
            {index > 0 && <Divider />}
            <ListItemButton onClick={() => handleItemClick(item)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </React.Fragment>
        ))}
      </List>
    </Drawer>
  );
};

export default MenuModel;
