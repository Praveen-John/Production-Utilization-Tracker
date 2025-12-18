import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ProductionRecord } from '../types';

interface AppContextType {
  // State
  user: User | null;
  users: User[];
  records: ProductionRecord[];
  loading: boolean;

  // User actions
  setUser: (user: User | null) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;

  // Record actions
  addRecord: (record: ProductionRecord) => void;
  updateRecord: (record: ProductionRecord) => void;
  deleteRecord: (id: string) => void;

  // Data fetching
  refreshData: () => Promise<void>;

  // Real-time updates
  lastUpdate: number;
  triggerUpdate: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch data from server
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch data');

      const { users: fetchedUsers, records: fetchedRecords } = await response.json();
      setUsers(fetchedUsers);
      setRecords(fetchedRecords);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data manually
  const refreshData = async () => {
    await fetchData();
  };

  // Trigger update for real-time simulation
  const triggerUpdate = () => {
    setLastUpdate(Date.now());
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Periodic data refresh for real-time updates (commented out to prevent automatic refresh)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchData();
  //   }, 10000); // Refresh every 10 seconds

  //   return () => clearInterval(interval);
  // }, []);

  // User actions
  const addUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    triggerUpdate();
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    triggerUpdate();
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    triggerUpdate();
  };

  // Record actions
  const addRecord = (newRecord: ProductionRecord) => {
    setRecords(prev => [...prev, newRecord]);

    // Persist to server
    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).catch(error => {
      console.error('Error adding record:', error);
      // Rollback on error
      setRecords(prev => prev.filter(r => r.id !== newRecord.id));
    });

    triggerUpdate();
  };

  const updateRecord = (updatedRecord: ProductionRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));

    // Persist to server
    fetch(`/api/records/${updatedRecord.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord)
    }).catch(error => {
      console.error('Error updating record:', error);
      // Rollback on error would require keeping previous state
    });

    triggerUpdate();
  };

  const deleteRecord = (id: string) => {
    const originalRecords = records;
    setRecords(prev => prev.filter(r => r.id !== id));

    // Persist to server
    fetch(`/api/records/${id}`, {
      method: 'DELETE'
    }).catch(error => {
      console.error('Error deleting record:', error);
      // Rollback on error
      setRecords(originalRecords);
    });

    triggerUpdate();
  };

  const value: AppContextType = {
    // State
    user,
    users,
    records,
    loading,

    // User actions
    setUser,
    addUser,
    updateUser,
    deleteUser,

    // Record actions
    addRecord,
    updateRecord,
    deleteRecord,

    // Data fetching
    refreshData,

    // Real-time updates
    lastUpdate,
    triggerUpdate
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};