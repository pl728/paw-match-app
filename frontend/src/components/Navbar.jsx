import React, { useEffect, useState } from 'react';
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
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthed) return;

  const fetchUnread = async () => {
    try {
      const savedAuth = JSON.parse(localStorage.getItem('pawmatch_auth'));
      const token = savedAuth?.token;

      const res = await fetch('/api/conversations/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Unread count failed: ${res.status}`);
      }

      const data = await res.json();
      setUnreadCount(data.count);
    } catch (err) {
      console.error(err);
    }
  };

    fetchUnread();

    const interval = setInterval(fetchUnread, 5000);

    return () => clearInterval(interval);
  }, [isAuthed]);

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
                      <Link to="/browse-pets" className={navLinkClass('/browse-pets')}>Browse All</Link>
                    </NavigationMenu.Link>
                  </NavigationMenu.Item>

                  <NavigationMenu.Item>
                    <NavigationMenu.Link asChild>
                      <Link to="/discover" className={navLinkClass('/discover')}>Find Your Match</Link>
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
                <button className="user-btn">
                  {user?.username}

                  {unreadCount > 0 && (
                    <span className="message-badge">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content className="dropdown">

                  <DropdownMenu.Item
                    className="dropdown-item"
                    onSelect={() => navigate('/conversations')}
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className="dropdown-message-count">
                        {unreadCount}
                      </span>
                    )}
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