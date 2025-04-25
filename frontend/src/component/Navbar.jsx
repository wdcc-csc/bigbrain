import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../locales/translations';

const Navbar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    await logout();
    handleClose();
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };
  
  if (!isAuthenticated()) {
    return null;
  }
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          BigBrain
        </Typography>
        
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          <Button 
            color="inherit" 
            onClick={() => navigate('/dashboard')}
          >
            {t('dashboard', language)}
          </Button>
        </Box>

        <IconButton
          color="inherit"
          aria-label="user menu"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          edge="end"
        >
          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={() => handleNavigate('/dashboard')}>
            {t('dashboard', language)}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            {t('logout', language)}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 