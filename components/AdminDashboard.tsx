import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, ProductionRecord, UserRole } from '../types';
import { TEAMS, FREQUENCIES, TASKS_WITH_TIME } from '../constants';
import { ChatBot } from './ChatBot';
import { TimeStudy } from './TimeStudy';
import { ConfirmationModal } from './ConfirmationModal';
import { useAppContext } from '../contexts/AppContext';
import { v4 as uuidv4 } from 'uuid';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Brush
} from 'recharts';
import { Users, LayoutDashboard, Database, LogOut, Plus, Search, Filter, Calendar, Download, Trash2, Edit2, X, Save, UserX, UserCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDate } from '../utils/dateUtils';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onLogout
}) => {
  const {
    users,
    records,
    addUser,
    updateUser,
    deleteUser,
    updateRecord,
    deleteRecord,
    lastUpdate,
    loading
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'records'>('overview');
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: UserRole.USER });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [recordsDateFilter, setRecordsDateFilter] = useState({ start: '', end: '' });
  const [overviewDateFilter, setOverviewDateFilter] = useState({ start: '', end: '' });
  const [overviewTeamFilter, setOverviewTeamFilter] = useState<string>('ALL');
  const [overviewUserFilter, setOverviewUserFilter] = useState<string>('ALL');
  
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [selectedUserForRecordsFilter, setSelectedUserForRecordsFilter] = useState<string | null>(null);

  // Force re-render when data updates (removed - context handles this automatically)
  // useEffect(() => {
  //   // This effect will trigger when lastUpdate changes, ensuring UI updates with fresh data
  // }, [lastUpdate]);

  // Editing state
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductionRecord>>({});
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});

  // Deleting state
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const [isEditTimeCustom, setIsEditTimeCustom] = useState(false);

  const overviewRef = useRef<HTMLDivElement>(null);
  
  // Effect to manage time field during record editing
  useEffect(() => {
      if (editingRecordId && editForm.processName) {
        const selectedTask = TASKS_WITH_TIME.find(t => t.name === editForm.processName);
        if (selectedTask) {
            // FIX: The type of selectedTask.time is (number | "runtime").
            // In this block, it's narrowed to `number`, but TypeScript fails to infer this
            // inside the setState callback. Assigning it to a `const` variable helps the compiler.
            const taskTime = selectedTask.time;
            if(taskTime === 'runtime') {
                setIsEditTimeCustom(true);
            } else {
                setIsEditTimeCustom(false);
                setEditForm(prev => ({...prev, totalUtilization: taskTime}));
            }
        }
      }
  }, [editForm.processName, editingRecordId]);

  // --- Data Aggregation ---
  
  const overviewRecords = useMemo(() => {
    return records.filter(r => {
       const matchesStart = overviewDateFilter.start ? r.completedDate >= overviewDateFilter.start : true;
       const matchesEnd = overviewDateFilter.end ? r.completedDate <= overviewDateFilter.end : true;
       const matchesTeam = overviewTeamFilter === 'ALL' ? true : r.team === overviewTeamFilter;
       const matchesUser = overviewUserFilter === 'ALL' ? true : r.userId === overviewUserFilter;
       
       return matchesStart && matchesEnd && matchesTeam && matchesUser;
    });
  }, [records, overviewDateFilter, overviewTeamFilter, overviewUserFilter]);

  const utilizationByUser = useMemo(() => {
    const userUtilization = users
      .filter(u => u.role !== 'ADMIN')
      .map(u => {
        const userRecords = overviewRecords.filter(r => r.userId === u.id);
        if (userRecords.length === 0) return null;

        // Get unique dates for this user
        const uniqueDates = new Set(userRecords.map(r => r.completedDate));
        const numberOfDays = uniqueDates.size;

        // Calculate total utilization in minutes
        const totalUtilMinutes = userRecords.reduce((acc, curr) => acc + curr.totalUtilization, 0);

        // Convert to hours
        const totalUtilHours = totalUtilMinutes / 60;

        // Average by number of days and cap at 8 hours average
        const averageHours = Math.min((totalUtilHours / numberOfDays), 8);

        // Convert to percentage of 8-hour day (for display purposes)
        const utilizationPercentage = (averageHours / 8) * 100;

        return {
          name: u.name,
          utilization: averageHours, // Show in hours
          utilizationPercentage: utilizationPercentage, // Percentage for tooltip
          days: numberOfDays,
          totalHours: totalUtilHours,
          team: userRecords[0]?.team || 'Unknown'
        };
      });

    return userUtilization
      .filter((u): u is NonNullable<typeof u> => u !== null && u.utilization > 0)
      .sort((a, b) => b.utilization - a.utilization);
  }, [users, overviewRecords]);

  const recordsByTeam = useMemo(() => TEAMS.map(team => {
    const count = overviewRecords.filter(r => r.team === team).length;
    return { name: team, count };
  }), [overviewRecords]);

  const processTaskByTeamData = useMemo(() => {
    const data: any[] = TEAMS.map(team => {
      if (overviewTeamFilter !== 'ALL' && team !== overviewTeamFilter) return null;

      const teamRecords = overviewRecords.filter(r => r.team === team);
      const processTaskCounts: Record<string, number> = {};
      
      teamRecords.forEach(r => {
        const combinedName = r.processName; // Merged process name is enough as they are now combined
        processTaskCounts[combinedName] = (processTaskCounts[combinedName] || 0) + 1;
      });

      return {
        name: team,
        ...processTaskCounts
      };
    }).filter(Boolean);
    return data;
  }, [overviewRecords, overviewTeamFilter]);

  const uniqueProcessTasks = useMemo(() => {
    const s = new Set<string>();
    overviewRecords.forEach(r => s.add(r.processName));
    return Array.from(s).sort();
  }, [overviewRecords]);

  const trendData = useMemo(() => {
    // Get total active users (non-admin) for averaging
    const totalActiveUsers = users.filter(u => u.role !== 'ADMIN').length;
    if (totalActiveUsers === 0) return [];

    const sortedDates = Array.from(new Set(overviewRecords.map(r => r.completedDate))).sort();
    return sortedDates.map(date => {
      const dailyTotal = overviewRecords
        .filter(r => r.completedDate === date)
        .reduce((acc, curr) => acc + curr.totalUtilization, 0);

      // Convert to hours and calculate per person average
      const dailyTotalHours = dailyTotal / 60;
      const perPersonAverage = dailyTotalHours / totalActiveUsers;

      return {
        date: formatDate(date),
        originalDate: date, // Keep original for sorting
        utilization: dailyTotal, // Keep original for potential use
        perPersonAverage: perPersonAverage // New per person average in hours
      };
    });
  }, [overviewRecords, users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (userRoleFilter === 'ALL') return true;
      return u.role === userRoleFilter;
    });
  }, [users, userRoleFilter]);


  const COLORS = ['#58a6ff', '#3fb950', '#d29922', '#f85149', '#a371f7', '#8b949e'];
  const getProcessColor = (index: number) => {
    const hues = [210, 130, 40, 350, 270, 180, 300, 50, 15, 75, 150, 190, 240, 330];
    return `hsl(${hues[index % hues.length]}, 70%, 60%)`;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) return;

    const u: User = {
      id: uuidv4(),
      role: newUser.role,
      username: newUser.username,
      password: newUser.password,
      name: newUser.name
    };

    console.log('Creating user in form:', u);
    await addUser(u);
    setNewUser({ name: '', username: '', password: '', role: UserRole.USER });
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.processName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.task.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStart = recordsDateFilter.start ? r.completedDate >= recordsDateFilter.start : true;
    const matchesEnd = recordsDateFilter.end ? r.completedDate <= recordsDateFilter.end : true;

    return matchesSearch && matchesStart && matchesEnd;
  }).sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime());

  const downloadPDF = async () => {
    if (!overviewRef.current) return;
    try {
      const element = overviewRef.current;
      const canvas = await html2canvas(element, {
        backgroundColor: '#0d1117',
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.9);

      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save('teamops-report.pdf');
    } catch (err) {
      console.error("PDF Generation failed", err);
      alert("Failed to generate PDF");
    }
  };

  const startEditingRecord = (record: ProductionRecord) => {
    setEditingRecordId(record.id);
    setEditForm({ ...record });
    const task = TASKS_WITH_TIME.find(t => t.name === record.processName);
    setIsEditTimeCustom(task?.time === 'runtime');
  };

  const saveEditRecord = () => {
    if (editingRecordId && editForm) {
      const util = Number(editForm.totalUtilization);
      if (util <= 0 || util > 480) {
        alert("Utilization must be greater than 0 and no more than 480 minutes (8 hours)");
        return;
      }
      updateRecord(editForm as ProductionRecord);
      setEditingRecordId(null);
      setEditForm({});
    }
  };

  const startEditingUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserForm({ ...user });
  };

  const saveEditUser = () => {
    if (editingUserId && editUserForm) {
      updateUser(editUserForm as User);
      setEditingUserId(null);
      setEditUserForm({});
    }
  };


  const selectClass = "bg-mac-bg border border-mac-border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-mac-accent";

  return (
    <div className="min-h-screen bg-mac-bg text-mac-text font-sans selection:bg-mac-accent selection:text-white pb-20">
      <nav className="glass sticky top-0 z-40 border-b border-mac-border">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg tracking-tight">Production and Utilization <span className="text-mac-accent">for Operations</span></span>
            </div>
            
            <div className="flex space-x-1 bg-mac-surface/50 p-1 rounded-lg border border-mac-border/50">
               {[
                 { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                 { id: 'users', label: 'Users', icon: Users },
                 { id: 'records', label: 'Records', icon: Database }
               ].map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id 
                      ? 'bg-mac-border/80 text-white shadow-sm' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                 >
                   <tab.icon size={16} />
                   {tab.label}
                 </button>
               ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400 hidden sm:inline">Welcome, <span className="text-white font-medium">{currentUser.name}</span></span>
              <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-mac-surface/30 p-4 rounded-xl border border-mac-border/50 gap-4">
               <h2 className="text-xl font-semibold text-white whitespace-nowrap">Dashboard Overview</h2>
               
               <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  {/* Filters */}
                  <div className="flex items-center gap-2 bg-mac-bg border border-mac-border rounded-lg px-2 py-1.5">
                      <span className="text-gray-500 text-xs flex items-center gap-1"><Filter size={12}/> Team:</span>
                      <select 
                        value={overviewTeamFilter}
                        onChange={(e) => setOverviewTeamFilter(e.target.value)}
                        className={`bg-transparent text-xs text-white focus:outline-none w-32 border-none`}
                      >
                        <option value="ALL" className="bg-mac-bg text-white">All Teams</option>
                        {TEAMS.map(t => <option key={t} value={t} className="bg-mac-bg text-white">{t}</option>)}
                      </select>
                  </div>

                  <div className="flex items-center gap-2 bg-mac-bg border border-mac-border rounded-lg px-2 py-1.5">
                      <span className="text-gray-500 text-xs flex items-center gap-1"><Users size={12}/> User:</span>
                      <select 
                        value={overviewUserFilter}
                        onChange={(e) => setOverviewUserFilter(e.target.value)}
                        className={`bg-transparent text-xs text-white focus:outline-none w-32 border-none`}
                      >
                        <option value="ALL" className="bg-mac-bg text-white">All Users</option>
                        {users.filter(u => u.role !== UserRole.ADMIN).map(u => <option key={u.id} value={u.id} className="bg-mac-bg text-white">{u.name}</option>)}
                      </select>
                  </div>

                  <div className="flex items-center gap-2 bg-mac-bg border border-mac-border rounded-lg px-2 py-1.5">
                      <span className="text-gray-500 text-xs flex items-center gap-1"><Calendar size={12}/> Date:</span>
                      <input 
                        type="date"
                        value={overviewDateFilter.start}
                        onChange={(e) => setOverviewDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-transparent text-xs text-white focus:outline-none w-24 [color-scheme:dark]"
                      />
                      <span className="text-gray-500 text-xs">-</span>
                      <input 
                        type="date"
                        value={overviewDateFilter.end}
                        onChange={(e) => setOverviewDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-transparent text-xs text-white focus:outline-none w-24 [color-scheme:dark]"
                      />
                  </div>
                  
                  <button 
                    onClick={downloadPDF}
                    className="flex items-center gap-2 bg-mac-accent hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors ml-auto"
                  >
                    <Download size={16} /> Export PDF
                  </button>
               </div>
            </div>

            <div ref={overviewRef} className="p-4 bg-mac-bg rounded-xl border border-transparent"> 
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Utilization Bar Chart */}
                <div className="glass rounded-xl p-6 border border-mac-border/50 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
                    <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                    Individual Utilization
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={utilizationByUser} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                        <XAxis
                          type="number"
                          stroke="#8b949e"
                          tick={{fill: '#8b949e', fontSize: 11}}
                          label={{ value: 'Hours (Avg)', position: 'outsideBottom', offset: 0, fill: '#8b949e', fontSize: 13, style: { fontWeight: 'bold' } }}
                          domain={[0, 8]}
                          ticks={[0, 2, 4, 6, 8]}
                        />
                        <YAxis dataKey="name" type="category" width={100} stroke="#8b949e" tick={{fill: '#8b949e'}} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                          cursor={{fill: 'rgba(255,255,255,0.05)'}}
                          labelFormatter={(name) => `User: ${name}`}
                          formatter={(value: any, name: any, props: any) => {
                            if (name === 'utilization') {
                              const data = props.payload;
                              return [
                                `${data.utilization.toFixed(1)} hrs (${data.utilizationPercentage.toFixed(1)}%)`,
                                'Daily Avg'
                              ];
                            }
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="utilization" fill="#58a6ff" radius={[0, 4, 4, 0]} animationDuration={1500} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart Distribution */}
                <div className="glass rounded-xl p-6 border border-mac-border/50 shadow-lg">
                  <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
                     <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                     Records Distribution (by Team)
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={recordsByTeam}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          stroke="none"
                        >
                          {recordsByTeam.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
                           itemStyle={{ color: '#fff' }}
                        />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Dynamic Stacked Bar Chart */}
                <div className="glass rounded-xl p-6 border border-mac-border/50 shadow-lg lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
                     <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                     Task Composition
                  </h3>
                  <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={processTaskByTeamData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#8b949e"
                          tick={{fill: '#8b949e', fontSize: 12}}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#8b949e" tick={{fill: '#8b949e'}} />
                        <Tooltip
                           contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
                           itemStyle={{ color: '#fff' }}
                           cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        />
                        <Legend
                           layout="horizontal"
                           verticalAlign="top"
                           align="center"
                           wrapperStyle={{paddingTop: '10px', paddingBottom: '20px'}}
                        />
                        {uniqueProcessTasks.map((processTask, index) => (
                           <Bar
                             key={processTask}
                             dataKey={processTask}
                             name={processTask} // Legend uses this
                             stackId="a"
                             fill={getProcessColor(index)}
                             animationDuration={1500}
                           />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Trend Area Chart */}
                <div className="glass rounded-xl p-6 border border-mac-border/50 shadow-lg lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-6 flex items-center text-white">
                     <span className="w-1 h-6 bg-orange-500 rounded-full mr-3"></span>
                     Overall Utilization Trend
                  </h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#58a6ff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis dataKey="date" stroke="#8b949e" tick={{fill: '#8b949e'}} />
                        <YAxis
                          stroke="#8b949e"
                          tick={{fill: '#8b949e'}}
                          label={{ value: 'Hours per Person', angle: -90, position: 'insideLeft', fill: '#8b949e', fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                          formatter={(value: any, name: any) => {
                            if (name === 'perPersonAverage') {
                              return [`${value.toFixed(2)} hrs`, 'Per Person Avg'];
                            }
                            return [value, name];
                          }}
                        />
                        <Brush dataKey="date" height={30} stroke="#58a6ff" />
                        <Area
                          type="monotone"
                          dataKey="perPersonAverage"
                          stroke="#58a6ff"
                          fillOpacity={1}
                          fill="url(#colorUtil)"
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="glass rounded-xl border border-mac-border/50 overflow-hidden shadow-lg">
            <div className="p-6 border-b border-mac-border/50 bg-mac-surface/30">
               <h3 className="text-lg font-semibold text-white mb-4">Create New User</h3>
               <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input 
                  placeholder="Full Name" 
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="bg-mac-bg border border-mac-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-mac-accent focus:outline-none" 
                  required
                />
                <input 
                  placeholder="Username" 
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  className="bg-mac-bg border border-mac-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-mac-accent focus:outline-none" 
                  required
                />
                <input 
                  type="password"
                  placeholder="Password" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="bg-mac-bg border border-mac-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-mac-accent focus:outline-none" 
                  required
                />
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="bg-mac-bg border border-mac-border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-mac-accent focus:outline-none"
                >
                  <option value={UserRole.USER}>USER</option>
                  <option value={UserRole.ADMIN}>ADMIN</option>
                </select>
                <button type="submit" className="bg-mac-accent hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Plus size={16} /> Add User
                </button>
              </form>
            </div>

            {/* Filter Toolbar */}
            <div className="px-6 py-3 border-b border-mac-border/50 bg-mac-surface/10 flex flex-col sm:flex-row justify-between items-center gap-3">
               <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                 <Users size={16} />
                 User Management 
                 <span className="text-gray-500 font-normal ml-2">({filteredUsers.length} total)</span>
               </h4>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium flex items-center gap-1">
                    <Filter size={12} />
                    Role Filter:
                  </span>
                  <div className="flex bg-mac-bg border border-mac-border rounded-lg p-1">
                      {(['ALL', UserRole.ADMIN, UserRole.USER] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => setUserRoleFilter(role)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                userRoleFilter === role 
                                ? 'bg-mac-accent text-white shadow-sm' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                             {role === 'ALL' ? 'All' : role}
                          </button>
                      ))}
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-mac-border/50">
                <thead className="bg-mac-surface/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mac-border/50 bg-transparent">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className={`transition-colors ${editingUserId === u.id ? 'bg-blue-900/20' : 'hover:bg-mac-surface/30'} ${u.isDisabled ? 'opacity-50' : ''}`}>
                      {editingUserId === u.id ? (
                        <>
                          <td className="px-6 py-4"><input value={editUserForm.name} onChange={e => setEditUserForm({...editUserForm, name: e.target.value})} className="bg-mac-bg border border-mac-border rounded px-2 py-1 text-sm w-full" /></td>
                          <td className="px-6 py-4"><input value={editUserForm.username} onChange={e => setEditUserForm({...editUserForm, username: e.target.value})} className="bg-mac-bg border border-mac-border rounded px-2 py-1 text-sm w-full" /></td>
                          <td className="px-6 py-4">
                            <select
                              value={editUserForm.role}
                              onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                              className={`appearance-none bg-mac-bg border rounded px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-mac-accent focus:outline-none cursor-pointer border-mac-border`}
                            >
                              <option value={UserRole.ADMIN}>ADMIN</option>
                              <option value={UserRole.USER}>USER</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={saveEditUser} className="text-green-400 hover:text-green-300 p-2 hover:bg-green-900/30 rounded-lg"><Save size={16}/></button>
                              <button onClick={() => setEditingUserId(null)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-lg"><X size={16}/></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${u.isDisabled ? 'text-gray-500' : 'text-white'}`}>
                            {u.isDisabled && <UserX size={14} className="inline mr-1 text-gray-500" />}
                            {u.name}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${u.isDisabled ? 'text-gray-600' : 'text-gray-300'}`}>{u.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{u.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => startEditingUser(u)} className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/30 rounded-lg"><Edit2 size={16}/></button>
                              <button
                                onClick={() => updateUser({ ...u, isDisabled: !u.isDisabled })}
                                className={`${u.isDisabled ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'} p-2 hover:bg-yellow-900/30 rounded-lg transition-all`}
                                title={u.isDisabled ? 'Enable User Account' : 'Disable User Account'}
                              >
                                {u.isDisabled ? <UserCheck size={16}/> : <UserX size={16}/>}
                              </button>
                              <button onClick={() => setDeletingUser(u)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                        No users found matching the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="glass rounded-xl border border-mac-border/50 overflow-hidden shadow-lg flex flex-col h-[800px]">
             <div className="p-4 border-b border-mac-border/50 flex flex-col md:flex-row justify-between items-center gap-4 bg-mac-surface/30">
               <h3 className="text-lg font-semibold text-white">All Records</h3>
               
               <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                 {/* Date Range Filters */}
                 <div className="flex items-center gap-2 bg-mac-bg border border-mac-border rounded-lg px-2 py-1">
                    <span className="text-gray-500 text-xs flex items-center gap-1"><Calendar size={12}/> From:</span>
                    <input 
                      type="date"
                      value={recordsDateFilter.start}
                      onChange={(e) => setRecordsDateFilter(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-transparent text-xs text-white focus:outline-none w-28 [color-scheme:dark]"
                    />
                    <span className="text-gray-500 text-xs">To:</span>
                    <input 
                      type="date"
                      value={recordsDateFilter.end}
                      onChange={(e) => setRecordsDateFilter(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-transparent text-xs text-white focus:outline-none w-28 [color-scheme:dark]"
                    />
                 </div>

                 <div className="relative">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                   <input 
                     type="text"
                     placeholder="Search records..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 bg-mac-bg border border-mac-border rounded-lg text-sm focus:ring-1 focus:ring-mac-accent focus:outline-none w-full md:w-64"
                   />
                 </div>
               </div>
             </div>
             <div className="flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-mac-border/50">
                <thead className="bg-mac-surface/50 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Team</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Freq</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Exp Util</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Act Util</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Count</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mac-border/50 bg-transparent">
                  {filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-mac-surface/30 transition-colors group">
                      {editingRecordId === r.id ? (
                        /* Editing Mode - Dropdowns */
                        <>
                          <td className="px-4 py-3">
                            <input type="date" className="bg-mac-bg border border-mac-border rounded px-1 w-full text-xs text-white [color-scheme:dark]" value={editForm.completedDate} onChange={e => setEditForm({...editForm, completedDate: e.target.value})} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400">{r.userName}</td>
                          <td className="px-4 py-3">
                             <select className={`${selectClass} w-32`} value={editForm.processName} onChange={e => setEditForm({...editForm, processName: e.target.value, task: e.target.value})}>
                               {TASKS_WITH_TIME.map(p => <option key={p.name} value={p.name} className="bg-mac-bg text-white">{p.name}</option>)}
                             </select>
                          </td>
                          <td className="px-4 py-3">
                             <select className={`${selectClass} w-32`} value={editForm.team} onChange={e => setEditForm({...editForm, team: e.target.value})}>
                               {TEAMS.map(t => <option key={t} value={t} className="bg-mac-bg text-white">{t}</option>)}
                             </select>
                          </td>
                          <td className="px-4 py-3">
                             <select className={`${selectClass} w-24`} value={editForm.frequency} onChange={e => setEditForm({...editForm, frequency: e.target.value})}>
                               {FREQUENCIES.map(f => <option key={f} value={f} className="bg-mac-bg text-white">{f}</option>)}
                             </select>
                          </td>
                          <td className="px-4 py-3"><input type="number" step="1" readOnly className="bg-mac-bg border border-mac-border rounded px-1 w-16 text-xs text-white opacity-50 cursor-not-allowed" value={(editForm.totalUtilization || 0) * (editForm.count || 0)} disabled /></td>
                          <td className="px-4 py-3"><input type="number" step="1" className="bg-mac-bg border border-mac-border rounded px-1 w-16 text-xs text-white" value={editForm.actualUtilizationUserInput || 0} onChange={e => setEditForm({...editForm, actualUtilizationUserInput: Number(e.target.value)})} /></td>
                          <td className="px-4 py-3"><input type="number" className="bg-mac-bg border border-mac-border rounded px-1 w-12 text-xs text-white" value={editForm.count} onChange={e => setEditForm({...editForm, count: Number(e.target.value)})} /></td>
                          <td className="px-4 py-3"><input className="bg-mac-bg border border-mac-border rounded px-1 w-full text-xs text-white" value={editForm.remarks} onChange={e => setEditForm({...editForm, remarks: e.target.value})} /></td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                               <button onClick={saveEditRecord} className="text-green-400 hover:text-green-300"><Save size={16}/></button>
                               <button onClick={() => setEditingRecordId(null)} className="text-red-400 hover:text-red-300"><X size={16}/></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* Display Mode */
                        <>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{formatDate(r.completedDate)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-mac-accent">{r.userName}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{r.task}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{r.team}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">{r.frequency}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">{(r.totalUtilization || 0) * (r.count || 0)} mins</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-mono">{r.actualUtilizationUserInput || 0} mins</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{r.count}</td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={r.remarks}>{r.remarks}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                             <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => startEditingRecord(r)} className="text-blue-400 hover:text-blue-300"><Edit2 size={16}/></button>
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setDeleteRecordId(r.id);
                                 }}
                                 className="text-red-400 hover:text-red-300"
                               >
                                 <Trash2 size={16}/>
                               </button>
                             </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">No records found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
      <TimeStudy />
      <ChatBot records={records} />
      
      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={!!deleteRecordId}
        onClose={() => setDeleteRecordId(null)}
        onConfirm={() => {
          if (deleteRecordId) deleteRecord(deleteRecordId);
          setDeleteRecordId(null);
        }}
        title="Delete Record"
        message="Are you sure you want to delete this production record? This action cannot be undone."
      />
      <ConfirmationModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={async () => {
          if (deletingUser) {
            await deleteUser(deletingUser.id);
          }
          setDeletingUser(null);
        }}
        title="Delete User"
        message={`Are you sure you want to delete the user "${deletingUser?.name}"? This will also remove all their associated records and cannot be undone.`}
      />
    </div>
  );
};