import React, { useState } from 'react';
import { User, ProductionRecord } from '../types';
import { DataEntryForm } from './DataEntryForm';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogOut, LayoutList, PlusSquare, Trash2, Calendar } from 'lucide-react';
import { TimeStudy } from './TimeStudy';
import { ConfirmationModal } from './ConfirmationModal';

interface UserDashboardProps {
  currentUser: User;
  records: ProductionRecord[];
  onAddRecord: (record: ProductionRecord) => void;
  onDeleteRecord: (id: string) => void;
  onLogout: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, records, onAddRecord, onDeleteRecord, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'entry' | 'my-records'>('entry');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const myRecords = records.filter(r => r.userId === currentUser.id);
  console.log('🔥 UserDashboard - Total records:', records.length, 'My records:', myRecords.length);

  // Sort records by date (Newest First)
  const sortedRecords = [...myRecords].sort((a, b) => {
    return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
  });

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    // Note: month is 1-based from input, but 0-based in JS Date
    setSelectedDate(new Date(year, month - 1, 2)); // Use day 2 to avoid timezone issues
  };

  const filteredRecords = myRecords.filter(r => {
      const recordDate = new Date(r.completedDate);
      return recordDate.getFullYear() === selectedDate.getFullYear() && recordDate.getMonth() === selectedDate.getMonth();
  });

  // Simple aggregation for user chart
  const dateMap = new Map<string, number>();
  filteredRecords.forEach(r => {
    const current = dateMap.get(r.completedDate) || 0;
    dateMap.set(r.completedDate, current + r.totalUtilization);
  });
  const chartData = Array.from(dateMap.entries())
    .map(([date, val]) => ({ date, utilization: val }))
    .sort((a, b) => a.date.localeCompare(b.date));

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
               {/* Chart Section */}
               <div className="glass shadow-lg rounded-xl p-6 border border-mac-border/50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    My Utilization Trend
                  </h3>
                  <input 
                      type="month" 
                      value={`${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`}
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
                          <linearGradient id="colorUserUtil" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis dataKey="date" stroke="#8b949e" tick={{fill: '#8b949e'}} />
                        <YAxis stroke="#8b949e" tick={{fill: '#8b949e'}} />
                        <Tooltip 
                           contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9', borderRadius: '8px' }}
                           itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="utilization" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorUserUtil)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-500 bg-mac-bg/30 rounded-lg border border-mac-border/30 border-dashed">
                    No records for the selected month.
                  </div>
                )}
              </div>

              <DataEntryForm currentUser={currentUser} onAddRecord={onAddRecord} />
            </div>

            <div className="lg:col-span-1">
              <div className="glass shadow-lg rounded-xl p-0 h-full overflow-hidden flex flex-col border border-mac-border/50">
                <div className="p-4 border-b border-mac-border/50 bg-mac-surface/30">
                   <h3 className="text-lg font-semibold text-white">Recent Entries</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[600px]">
                  {sortedRecords.length === 0 ? (
                    <div className="text-center mt-10 text-gray-500 text-sm">No records submitted yet.</div>
                  ) : (
                    <ul className="space-y-3">
                      {sortedRecords.slice(0, 5).map(r => (
                        <li key={r.id} className="relative bg-mac-surface/50 p-3 rounded-lg border border-mac-border/50 hover:bg-mac-surface transition-colors group">
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-mac-accent rounded-r-full group-hover:bg-blue-400"></div>
                          <div className="pl-3">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-white">{r.processName}</span>
                              <span className="text-xs text-gray-500 font-mono">{r.completedDate}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                              <span className="truncate max-w-[60%]">{r.team}</span>
                              <span className="bg-mac-border/50 px-2 py-0.5 rounded text-gray-300">{r.totalUtilization}min</span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
             </div>
             
             <div className="flex-1 overflow-auto">
               <table className="min-w-full divide-y divide-mac-border/50">
                 <thead className="bg-mac-surface/50 sticky top-0 backdrop-blur-md z-10">
                   <tr>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Task / Process</th>
                     <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Stats</th>
                     <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-mac-border/50 bg-transparent">
                   {sortedRecords.map(r => (
                     <tr key={r.id} className="hover:bg-mac-surface/30 transition-colors group">
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-white font-medium">
                            <Calendar size={14} className="mr-2 text-gray-500"/>
                            {r.completedDate}
                          </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-sm font-medium text-white">{r.processName}</span>
                           <span className="text-xs text-gray-400 mt-0.5">{r.team}</span>
                           {r.remarks && <span className="text-xs text-gray-500 mt-1 italic">"{r.remarks}"</span>}
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50 w-fit">
                              {r.totalUtilization} Min
                            </span>
                            <span className="text-xs text-gray-500">Count: {r.count}</span>
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
                   {sortedRecords.length === 0 && (
                     <tr>
                       <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
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
          if (deleteId) onDeleteRecord(deleteId);
        }}
        title="Delete Record"
        message="Are you sure you want to delete this production record? This action cannot be undone."
      />
    </div>
  );
};