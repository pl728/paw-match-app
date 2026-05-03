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
  const isShelterAdmin = user?.role === 'shelter_admin';

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navLinkClass = (path) =>
    `nav-link ${location.pathname === path ? 'active' : ''}`;

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        <Link to={isAuthed ? "/home" : "/"} className="brand">
          <img src={pawmatchlogo} className="logo" alt="PawMatch" />
          <span className="brand-name">PawMatch</span>

          {isShelterAdmin && (
            <span className="admin-badge">Admin</span>
          )}
        </Link>

        {isAuthed && (
          <NavigationMenu.Root className="nav-menu">
            <NavigationMenu.List className="nav-list">

              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/home" className={navLinkClass('/home')}>Home</Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Link asChild>
                  <Link to="/feed" className={navLinkClass('/feed')}>Feed</Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>

              {!isShelterAdmin && (
                <>
                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/browse-pets" className={navLinkClass('/browse-pets')}>Pets</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/discover" className={navLinkClass('/discover')}>Discover</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/favorites" className={navLinkClass('/favorites')}>Favorites</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/browse-shelters" className={navLinkClass('/browse-shelters')}>Shelters</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/pet-finder" className={navLinkClass('/pet-finder')}>Search</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/user-faq" className={navLinkClass('/user-faq')}>FAQ</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                </>
              )}

              {isShelterAdmin && (
                <>
                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/create-pet" className={navLinkClass('/create-pet')}>Add Pet</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/admin-faq" className={navLinkClass('/admin-faq')}>FAQ</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/view-admin-pets" className={navLinkClass('/view-admin-pets')}>View Pets</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>
                </>
              )}

            </NavigationMenu.List>
          </NavigationMenu.Root>
        )}

        <div className="nav-actions">
          {isAuthed ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="user-btn">{user?.username}</button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className="dropdown">

                  <DropdownMenu.Item className="dropdown-item" onSelect={() => navigate('/conversations')}>
                    Messages
                  </DropdownMenu.Item>

                  <DropdownMenu.Item className="dropdown-item" onSelect={() => navigate('/profile')}>
                    Profile
                  </DropdownMenu.Item>

                  <DropdownMenu.Item className="dropdown-item" onSelect={handleLogout}>
                    Logout
                  </DropdownMenu.Item>

                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <>
              <Link to="/login" className="nav-btn">Log in</Link>
              <Link to="/register" className="nav-btn primary">Register</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;