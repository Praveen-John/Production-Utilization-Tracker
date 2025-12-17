import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { User, ProductionRecord, UserRole } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loginError, setLoginError] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []); // Empty dependency array means this runs once on mount

  // Effect to save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  // Load data from the backend API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
          throw new Error('Failed to fetch initial data');
        }
        const { users, records } = await response.json();
        setUsers(users);
        setRecords(records);
      } catch (error) {
        console.error("API Error:", error);
        setLoginError("Could not connect to the server.");
      } finally {
        setIsDataLoaded(true);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
  }, [user]);

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

  const handleAddUser = async (newUser: User) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const addedUser = await response.json();
      setUsers(prev => [...prev, addedUser]);
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const returnedUser = await response.json();

      // Update users list
      setUsers(prev => prev.map(u => u.id === returnedUser.id ? returnedUser : u));

      // If updating current user, update local state and check if disabled
      if (user && user.id === returnedUser.id) {
        setUser(returnedUser);

        // If user was disabled, log them out immediately
        if (returnedUser.isDisabled) {
          setUser(null);
          alert('Your account has been disabled. You have been logged out.');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setUsers(prev => prev.filter(u => u.id !== id));
      // Also remove records associated with the deleted user
      setRecords(prev => prev.filter(r => r.userId !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleAddRecord = async (newRecord: ProductionRecord) => {
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const addedRecord = await response.json();
      console.log('🔥 Added record received from API:', addedRecord);

      // Update local state
      setRecords(prev => {
        console.log('🔥 Before adding, total records:', prev.length);
        const updated = [...prev, addedRecord];
        console.log('🔥 After adding, total records:', updated.length);
        return updated;
      });

      console.log('🔥 Record added successfully to UI');
    } catch (error) {
      console.error('Failed to add record:', error);
      alert('Failed to add record: ' + error.message);
    }
  };

  const handleUpdateRecord = async (updatedRecord: ProductionRecord) => {
    try {
      // Clean the record data before sending
      const cleanRecord = { ...updatedRecord };
      delete (cleanRecord as any).customTask; // Remove customTask field if present
      delete (cleanRecord as any)._id; // Remove MongoDB _id field to prevent conflicts

      console.log('Updating record:', cleanRecord);

      const response = await fetch('/api/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanRecord),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const returnedRecord = await response.json();
      setRecords(prev => prev.map(r => r.id === returnedRecord.id ? returnedRecord : r));
    } catch (error) {
      console.error('Failed to update record:', error);
      alert('Failed to update record: ' + error.message);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const response = await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔥 Record deletion result:', result);

      // Update local state
      setRecords(prev => {
        console.log('🔥 Before deletion, total records:', prev.length);
        const updated = prev.filter(r => r.id !== id);
        console.log('🔥 After deletion, total records:', updated.length);
        return updated;
      });

      console.log('🔥 Record deleted successfully from UI');
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record: ' + error.message);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-mac-bg flex items-center justify-center text-white">Connecting to database...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  if (user.role === UserRole.ADMIN) {
    return (
      <AdminDashboard 
        currentUser={user}
        users={users} 
        records={records} 
        onAddUser={handleAddUser} 
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={handleDeleteRecord}
        onLogout={handleLogout} 
      />
    );
  }

  return (
    <UserDashboard 
      currentUser={user} 
      records={records} 
      onAddRecord={handleAddRecord} 
      onDeleteRecord={handleDeleteRecord}
      onLogout={handleLogout} 
    />
  );
}

export default App;