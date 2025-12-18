import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-mac-surface border border-mac-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-slide-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-900/20 rounded-full shrink-0 border border-red-900/30">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        <div className="bg-mac-bg/50 p-4 border-t border-mac-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg shadow-red-900/20"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};