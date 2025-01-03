import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore, Side } from '@state/appStore.tsx';

type Page = {
  title: string;
  route: string;
  icon: React.ReactElement;
  side: Side;
};

const pages: Page[] = [
  { title: 'Left Side', route: '/left/', icon: <HomeIcon />, side: 'left' },
  { title: 'Right Side', route: '/right/', icon: <HomeIcon />, side: 'right' },
  { title: 'Schedules', route: '/schedules/', icon: <ScheduleIcon />, side: 'left' },
  { title: 'Settings', route: '/settings/', icon: <SettingsIcon />, side: 'left' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isUpdating, setSide } = useAppStore();
  const currentTitle = pages.find((page) => page.route === pathname)?.title;
  const [mobileNavValue, setMobileNavValue] = React.useState(
    pages.findIndex((page) => page.route === pathname)
  );

  // Handle navigation for both desktop and mobile
  const handleNavigation = (route: string, side: Side) => {
    setSide(side);
    navigate(route);
  };

  const handleMobileNavChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMobileNavValue(newValue);
    handleNavigation(pages[newValue].route, pages[newValue].side);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <AppBar position="static" sx={{ display: { xs: 'none', md: 'flex' } }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentTitle || 'App Title'}
          </Typography>
          {/* Desktop Navigation Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {pages.map(({ title, route, side }) => (
              <Button
                key={route}
                onClick={() => handleNavigation(route, side)}
                sx={{ color: 'white' }}
                variant={pathname === route ? 'outlined' : 'text'}
                disabled={isUpdating}
              >
                {title}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Bottom Navigation */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          width: '100%',
          position: 'fixed',
          bottom: 0,
          justifyContent: 'space-between',
        }}
      >
        <BottomNavigation
          value={mobileNavValue}
          onChange={handleMobileNavChange}
          sx={{ width: '100%' }}
        >
          {
            pages.map(({ title, icon }, index) => (
            <BottomNavigationAction
              key={index}
              label={title}
              icon={icon}
              disabled={isUpdating}
            />
          ))}
        </BottomNavigation>
      </Box>
    </>
  );
}
