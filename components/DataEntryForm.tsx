import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import { ProductionRecord, User } from '../types';
import { TASKS_WITH_TIME, TEAMS, FREQUENCIES } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentDateISO } from '../utils/dateUtils';

interface DataEntryFormProps {
  currentUser: User;
  onAddRecord: (record: ProductionRecord) => void;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ currentUser, onAddRecord }) => {
  const [formData, setFormData] = useState<Partial<ProductionRecord>>({
    processName: TASKS_WITH_TIME[0].name,
    team: TEAMS[0],
    frequency: FREQUENCIES[0],
    completedDate: getCurrentDateISO(),
    count: 1,
    remarks: '',
    actualUtilizationUserInput: 0
  });

  const [isRuntimeTask, setIsRuntimeTask] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Effect to check if selected task is runtime
  useEffect(() => {
    const selectedTask = TASKS_WITH_TIME.find(t => t.name === formData.processName);
    setIsRuntimeTask(selectedTask?.time === 'runtime');

    // Reset duration if not runtime task
    if (selectedTask?.time !== 'runtime') {
      const taskTime = typeof selectedTask?.time === 'number' ? selectedTask.time : 0;
      setFormData(prev => ({ ...prev, totalUtilization: taskTime }));
    }
  }, [formData.processName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.processName || !formData.team || !formData.frequency) {
        setErrorMessage("Please fill in all required fields.");
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
    }

    // Check if Duration Meter, Actual Utilization, and Number Of Count are all 0
    const durationMeter = formData.totalUtilization || 0;
    const actualUtilization = formData.actualUtilizationUserInput || 0;
    const numberOfCount = Number(formData.count) || 0;

    if (durationMeter === 0 && actualUtilization === 0 && numberOfCount === 0) {
        setErrorMessage("Error: At least one of Duration Meter, Actual Utilization, or Number Of Count must have a value greater than 0.");
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
    }

    // Check if Actual Utilization is greater than 0
    if (actualUtilization <= 0) {
        setErrorMessage("Error: Actual Utilization (Count X Duration) must have a value greater than 0.");
        setShowError(true);
        setTimeout(() => setShowError(false), 4000);
        return;
    }

    const newRecord: ProductionRecord = {
      id: uuidv4(),
      userId: currentUser.id,
      userName: currentUser.name,
      processName: formData.processName,
      team: formData.team!,
      task: formData.processName,
      frequency: formData.frequency || 'Daily',
      totalUtilization: formData.totalUtilization || 0,
      completedDate: formData.completedDate || getCurrentDateISO(),
      count: Number(formData.count) || 0,
      remarks: formData.remarks || '',
      actualUtilization: 0,
      actualVolume: (formData.totalUtilization || 0) * (Number(formData.count) || 0),
      actualUtilizationUserInput: formData.actualUtilizationUserInput || 0
    };

    onAddRecord(newRecord);

    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Reset form safely
    const firstTask = TASKS_WITH_TIME[0];
    const firstTaskTime = typeof firstTask?.time === 'number' ? firstTask.time : 0;
    setFormData(prev => ({
      ...prev,
      processName: TASKS_WITH_TIME[0].name,
      totalUtilization: firstTaskTime,
      count: 1,
      remarks: '',
      actualUtilizationUserInput: 0
    }));
  };

  const inputClass = "mt-1 block w-full rounded-lg bg-mac-bg border-mac-border text-white shadow-sm focus:border-mac-accent focus:ring-mac-accent sm:text-sm p-2.5 border placeholder-gray-500 transition-colors appearance-none";
  const labelClass = "block text-sm font-medium text-gray-400";

  return (
    <div className="glass shadow-lg rounded-xl p-6 border border-mac-border/50">
      <h3 className="text-lg font-semibold leading-6 text-white mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        New Production Entry
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div>
          <label className={labelClass}>Task Name</label>
          <select
            value={formData.processName}
            onChange={e => setFormData({...formData, processName: e.target.value})}
            className={inputClass}
          >
            {TASKS_WITH_TIME.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Team</label>
          <select
            value={formData.team}
            onChange={e => setFormData({...formData, team: e.target.value})}
            className={inputClass}
          >
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Frequency</label>
          <select
            value={formData.frequency}
            onChange={e => setFormData({...formData, frequency: e.target.value})}
            className={inputClass}
          >
            {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Completed Date</label>
          <input
            type="date"
            required
            value={formData.completedDate}
            onChange={e => setFormData({...formData, completedDate: e.target.value})}
            className={inputClass}
            style={{colorScheme: 'dark'}}
          />
        </div>

        <div>
          <label className={labelClass}>Duration Meter (in mins)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="480" // 8 hours = 480 minutes
            readOnly={!isRuntimeTask}
            value={formData.totalUtilization || 0}
            onChange={e => isRuntimeTask && setFormData({...formData, totalUtilization: parseInt(e.target.value) || 0})}
            className={`${inputClass} ${!isRuntimeTask ? 'bg-mac-surface cursor-not-allowed opacity-70' : ''}`}
          />
          <p className="text-xs text-gray-500 mt-1">
            {isRuntimeTask ? 'Enter duration in minutes (1-480 minutes)' : 'Auto-filled based on task time'}
          </p>
        </div>

        <div>
          <label className={labelClass}>Actual Volume (in mins)</label>
          <input
            type="number"
            step="1"
            min="0"
            readOnly
            value={(formData.totalUtilization || 0) * (Number(formData.count) || 0)}
            className={`${inputClass} bg-mac-surface cursor-not-allowed opacity-70`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-calculated as Duration Meter × Number Of Count
          </p>
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Expected Utilization (Count X Duration) (in mins)</label>
          <input
            type="number"
            step="1"
            min="0"
            readOnly
            value={(formData.totalUtilization || 0) * (Number(formData.count) || 0)}
            className={`${inputClass} bg-mac-surface cursor-not-allowed opacity-70`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-calculated as Duration Meter × Number Of Count
          </p>
        </div>

        <div>
          <label className={labelClass}>Actual Utilization (Count X Duration) (in mins)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="480" // 8 hours = 480 minutes
            value={formData.actualUtilizationUserInput || 0}
            onChange={e => setFormData({...formData, actualUtilizationUserInput: parseInt(e.target.value) || 0})}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter Count X Duration in minutes
          </p>
        </div>

        <div>
          <label className={labelClass}>Number Of Count</label>
          <input
            type="number"
            required
            min="1"
            step="1"
            value={formData.count || 1}
            onChange={e => setFormData({...formData, count: parseInt(e.target.value) || 1})}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the count
          </p>
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={e => setFormData({...formData, remarks: e.target.value})}
            className={`${inputClass} h-20`}
            placeholder="Optional comments..."
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center rounded-lg border border-transparent bg-mac-accent py-2.5 px-6 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-mac-accent focus:ring-offset-2 focus:ring-offset-gray-900 transition-all hover:scale-105"
          >
            Save Record
          </button>
        </div>

      </form>

      {/* Error Toast */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="glass rounded-lg border border-red-900/50 shadow-xl p-4 flex items-center gap-3 min-w-[320px] bg-red-900/20">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-base">Validation Error</p>
              <p className="text-gray-300 text-sm mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="glass rounded-lg border border-mac-border/50 shadow-xl p-4 flex items-center gap-3 min-w-[320px] bg-mac-surface/80">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={20} className="text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-base">Record Added Successfully!</p>
              <p className="text-gray-400 text-sm mt-1">Your production entry has been saved.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};