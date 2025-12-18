import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { User, ProductionRecord, UserRole } from './types';
import { AppProvider, useAppContext } from './contexts/AppContext';

// Main app content component that uses the context
function AppContent() {
  const [loginError, setLoginError] = useState('');
  const { user, setUser, users, records, loading } = useAppContext();

  // Effect to load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [setUser]);

  // Effect to save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  // Periodic check to see if current user has been disabled
  useEffect(() => {
    if (!user) return;

    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) return;

        const allUsers = await response.json();
        const currentUser = allUsers.find((u: User) => u.id === user.id);

        if (currentUser && currentUser.isDisabled && !user.isDisabled) {
          setUser(null);
          alert('Your account has been disabled by an administrator. You have been logged out.');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkUserStatus, 30000);

    return () => clearInterval(interval);
  }, [user, setUser]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const { message } = await response.json();
        setLoginError(message || 'Invalid credentials');
        return;
      }

      const foundUser = await response.json();
      if (foundUser.isDisabled) {
        setLoginError('This account has been disabled.');
        return;
      }
      setUser(foundUser);
      setLoginError('');
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('An error occurred during login.');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-mac-bg flex items-center justify-center text-white">Connecting to database...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard currentUser={user} onLogout={handleLogout} />;
  }

  return <UserDashboard currentUser={user} onLogout={handleLogout} />;
}

// Main App component that provides the context
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;