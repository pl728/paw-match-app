import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../auth/useAuth.js';
import pawmatchlogo from '../assets/pawmatch_logo.png';

function Navbar() {
  const { isAuthed, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navLinkStyle = (path) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: location.pathname === path ? '#fff' : '#cdd6e3',
    background: location.pathname === path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
  });

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'rgba(11, 12, 16, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px'
      }}>
        <Link
          to={isAuthed ? "/home" : "/"}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}
        >
          <img src={pawmatchlogo} style={{ height: '36px' }} alt="PawMatch" />
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>PawMatch</span>
        </Link>

        {isAuthed && (
          <NavigationMenu.Root style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <NavigationMenu.List style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/home" style={navLinkStyle('/home')}>
                    Home
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/feed" style={navLinkStyle('/feed')}>
                    Feed
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/browse-pets" style={navLinkStyle('/browse-pets')}>
                    Browse Pets
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/browse-shelters" style={navLinkStyle('/browse-shelters')}>
                    Browse Shelters
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/pet-finder" style={navLinkStyle('/pet-finder')}>
                    Search
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              {user?.role === 'shelter_admin' && (
                <NavigationMenu.Item>
                  <NavigationMenu.Link asChild>
                    <Link to="/create-pet" style={navLinkStyle('/create-pet')}>
                      Add Pet
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              )}
            </NavigationMenu.List>
          </NavigationMenu.Root>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAuthed ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}>
                  {user?.username}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content style={{
                  minWidth: '160px',
                  background: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '4px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                  zIndex: 9999
                }}>
                  <DropdownMenu.Item
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      color: '#cdd6e3',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    onSelect={() => navigate('/profile')}
                  >
                    Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      color: '#cdd6e3',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    onSelect={handleLogout}
                  >
                    Logout
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <>
              <Link to="/login" style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'transparent',
                color: '#fff',
                textDecoration: 'none'
              }}>
                Log in
              </Link>
              <Link to="/register" style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                textDecoration: 'none'
              }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
