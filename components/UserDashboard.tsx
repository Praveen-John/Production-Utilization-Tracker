import React, { useState, useEffect } from 'react';
import { User, ProductionRecord } from '../types';
import { DataEntryForm } from './DataEntryForm';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogOut, LayoutList, PlusSquare, Trash2, Calendar, Check } from 'lucide-react';
import { TimeStudy } from './TimeStudy';
import { ConfirmationModal } from './ConfirmationModal';
import { formatDate } from '../utils/dateUtils';
import { useAppContext } from '../contexts/AppContext';

interface UserDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout }) => {
  const { records, deleteRecord, lastUpdate } = useAppContext();
  const [activeTab, setActiveTab] = useState<'entry' | 'my-records'>('entry');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  // Force re-render when data updates (removed - context handles this automatically)
  // useEffect(() => {
  //   // This effect will trigger when lastUpdate changes, ensuring UI updates with fresh data
  // }, [lastUpdate]);

  const myRecords = records.filter(r => r.userId === currentUser.id);
  console.log('🔥 UserDashboard - Total records:', records.length, 'My records:', myRecords.length);

  // Sort records by date (Newest First)
  const sortedRecords = [...myRecords].sort((a, b) => {
    return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
  };

  // Filter records for the chart based on selected month
  const chartRecords = selectedMonth && selectedMonth.trim() !== ''
    ? myRecords.filter(r => r.completedDate.startsWith(selectedMonth))
    : myRecords;

  const filteredRecords = selectedDate && selectedDate.trim() !== ''
    ? myRecords.filter(r => r.completedDate === selectedDate)
    : sortedRecords; // Use sortedRecords to show all records sorted by date

  // Aggregation for user chart with Actual and Expected Utilization
  const actualUtilizationMap = new Map<string, number>();
  const expectedUtilizationMap = new Map<string, number>();

  chartRecords.forEach(r => {
    // Actual Utilization in hours (from user input)
    const actualHours = (r.actualUtilizationUserInput || 0) / 60;
    const currentActual = actualUtilizationMap.get(r.completedDate) || 0;
    actualUtilizationMap.set(r.completedDate, currentActual + actualHours);

    // Expected Utilization in hours (Duration Meter × Count)
    const expectedHours = (r.totalUtilization * (r.count || 0)) / 60;
    const currentExpected = expectedUtilizationMap.get(r.completedDate) || 0;
    expectedUtilizationMap.set(r.completedDate, currentExpected + expectedHours);
  });

  // Get all unique dates
  const allDates = new Set([...actualUtilizationMap.keys(), ...expectedUtilizationMap.keys()]);

  const chartData = Array.from(allDates)
    .map(date => ({
      date: formatDate(date),
      actualUtilization: actualUtilizationMap.get(date) || 0,
      expectedUtilization: expectedUtilizationMap.get(date) || 0,
      originalDate: date // Keep original date for sorting
    }))
    .sort((a, b) => a.originalDate.localeCompare(b.originalDate));

  return (
    <div className="min-h-screen bg-mac-bg text-mac-text font-sans selection:bg-mac-accent selection:text-white pb-20">
      {/* Mac Navbar */}
      <nav className="glass sticky top-0 z-40 border-b border-mac-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg tracking-tight">Production and Utilization for Operations</span>
            </div>
            
            <div className="flex space-x-1 bg-mac-surface/50 p-1 rounded-lg border border-mac-border/50">
               <button
                  onClick={() => setActiveTab('entry')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'entry' 
                    ? 'bg-mac-border/80 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
               >
                 <PlusSquare size={16} />
                 Data Entry
               </button>
               <button
                  onClick={() => setActiveTab('my-records')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'my-records' 
                    ? 'bg-mac-border/80 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
               >
                 <LayoutList size={16} />
                 Your Records
               </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {activeTab === 'entry' && (
          <div className="space-y-8">
            <DataEntryForm currentUser={currentUser} />

               {/* Chart Section */}
               <div className="glass shadow-lg rounded-xl p-6 border border-mac-border/50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    My Utilization Trend (Hours)
                  </h3>
                  <input
                      type="month"
                      value={selectedMonth || ''}
                      onChange={handleMonthChange}
                      className="bg-mac-surface text-white border border-mac-border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-mac-accent"
                      style={{colorScheme: 'dark'}}
                  />
                </div>
                {chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorActualUtil" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpectedUtil" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis dataKey="date" stroke="#8b949e" tick={{fill: '#8b949e'}} />
                        <YAxis stroke="#8b949e" tick={{fill: '#8b949e'}} />
                        <Tooltip
                           contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
                           itemStyle={{ color: '#fff' }}
                           formatter={(value: number, name: string) => [
                             `${value.toFixed(2)} hours`,
                             name === 'actualUtilization' ? 'Actual Utilization' : 'Expected Utilization'
                           ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="actualUtilization"
                          stroke="#3b82f6"
                          fillOpacity={0.6}
                          fill="url(#colorActualUtil)"
                          animationDuration={1500}
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="expectedUtilization"
                          stroke="#10b981"
                          fillOpacity={0.6}
                          fill="url(#colorExpectedUtil)"
                          animationDuration={1500}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500 bg-mac-bg/30 rounded-lg border border-mac-border/30 border-dashed">
                    {selectedMonth ? `No records for ${new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.` : 'No records available.'}
                  </div>
                )}
               </div>

               {/* Recent Entries Section */}
               <div className="glass shadow-lg rounded-xl p-6 border border-mac-border/50">
                 <div className="p-4 border-b border-mac-border/50 bg-mac-surface/30">
                   <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                     <LayoutList className="text-mac-accent" size={20} />
                     Recent Entries
                   </h3>
                 </div>
                 <div className="p-4">
                   {sortedRecords.length === 0 ? (
                     <div className="text-center text-gray-500 text-sm py-8">No records submitted yet.</div>
                   ) : (
                     <ul className="space-y-3">
                       {sortedRecords.slice(0, 5).map(r => (
                         <li key={r.id} className="relative bg-mac-surface/50 p-3 rounded-lg border border-mac-border/50 hover:bg-mac-surface transition-colors group">
                           <div className="absolute left-0 top-3 bottom-3 w-1 bg-mac-accent rounded-r-full group-hover:bg-blue-400"></div>
                           <div className="pl-3">
                             <div className="flex justify-between items-start">
                               <span className="text-sm font-medium text-white">{r.processName}</span>
                               <span className="text-xs text-gray-500 font-mono">{formatDate(r.completedDate)}</span>
                             </div>
                             <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                               <span className="truncate max-w-[60%]">{r.team}</span>
                               <span className="bg-mac-border/50 px-2 py-0.5 rounded text-gray-300">{r.totalUtilization} min</span>
                             </div>
                           </div>
                         </li>
                       ))}
                     </ul>
                   )}
                 </div>
               </div>
          </div>
        )}

        {activeTab === 'my-records' && (
           <div className="glass rounded-xl border border-mac-border/50 overflow-hidden shadow-lg flex flex-col min-h-[600px]">
             <div className="p-6 border-b border-mac-border/50 bg-mac-surface/30 flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-mac-accent/10 rounded-lg">
                    <LayoutList className="text-mac-accent" size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-white">Your Production Records</h3>
                    <p className="text-sm text-gray-500">Manage and track your submitted work logs</p>
                 </div>
               </div>
               <input
                   type="date"
                   value={selectedDate || ''}
                   onChange={handleDateChange}
                   className="bg-mac-surface text-white border border-mac-border rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-mac-accent"
                   style={{colorScheme: 'dark'}}
               />
             </div>

             {/* Summary Statistics */}
             {filteredRecords.length > 0 && selectedDate && (
               <div className="px-6 py-4 bg-mac-surface/30 border-b border-mac-border/50">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="text-center">
                     <p className="text-sm text-gray-400">Expected Utilization Per Person</p>
                     <p className="text-2xl font-bold text-blue-400">
                       {(filteredRecords.reduce((sum, r) => sum + (r.totalUtilization || 0) * (r.count || 0), 0) / 60).toFixed(2)} hrs
                     </p>
                   </div>
                   <div className="text-center">
                     <p className="text-sm text-gray-400">Actual Overall Per Day Utilization</p>
                     <p className="text-2xl font-bold text-green-400">
                       {(filteredRecords.reduce((sum, r) => sum + (r.actualUtilizationUserInput || 0), 0) / 60).toFixed(2)} hrs
                     </p>
                   </div>
                 </div>
               </div>
             )}

             <div className="flex-1 overflow-auto">
               <table className="min-w-full divide-y divide-mac-border/50">
                 <thead className="bg-mac-surface/50 sticky top-0 backdrop-blur-md z-10">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasks</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Expected Utilization</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actual Utilization</th>
                     <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-mac-border/50 bg-transparent">
                   {filteredRecords.map(r => (
                     <tr key={r.id} className="hover:bg-mac-surface/30 transition-colors group">
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-white font-medium">
                            <Calendar size={14} className="mr-2 text-gray-500"/>
                            {formatDate(r.completedDate)}
                          </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-sm font-medium text-white">{r.task}</span>
                           <span className="text-xs text-gray-400 mt-0.5">{r.team}</span>
                           {r.remarks && <span className="text-xs text-gray-500 mt-1 italic">"{r.remarks}"</span>}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-900/50 w-fit">
                              {(r.totalUtilization || 0) * (r.count || 0)} mins
                            </span>
                          </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50 w-fit">
                              {r.actualUtilizationUserInput || 0} mins
                            </span>
                          </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             setDeleteId(r.id);
                           }}
                           className="text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-red-900/20 rounded-lg"
                           title="Delete Record"
                         >
                           <Trash2 size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {filteredRecords.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                         <div className="flex flex-col items-center gap-2">
                           <LayoutList size={32} className="opacity-20" />
                           <p>No records found. Switch to Data Entry to add one.</p>
                         </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        )}

      </div>
      <TimeStudy />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteRecord(deleteId);
            // Show delete success toast
            setShowDeleteToast(true);
            setTimeout(() => setShowDeleteToast(false), 3000);
          }
        }}
        title="Delete Record"
        message="Are you sure you want to delete this production record? This action cannot be undone."
      />

      {/* Delete Success Toast */}
      {showDeleteToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="glass rounded-lg border border-mac-border/50 shadow-xl p-4 flex items-center gap-3 min-w-[320px] bg-mac-surface/80">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Check size={20} className="text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-base">Record Deleted Successfully!</p>
              <p className="text-gray-400 text-sm mt-1">Your production record has been removed.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};