import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Info, X, Check } from 'lucide-react';

export type ModalType = 'ALERT' | 'CONFIRM';

interface PopupModalProps {
  isOpen: boolean;
  type: ModalType;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const PopupModal: React.FC<PopupModalProps> = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure focus works after render
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAlert = type === 'ALERT';
  const borderColor = isAlert ? 'border-term-blue' : 'border-term-red';
  const iconColor = isAlert ? 'text-term-blue' : 'text-term-red';

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-md bg-gray-900 border ${borderColor} shadow-[0_0_30px_rgba(0,0,0,0.5)] p-1`}>
        {/* Header */}
        <div className={`flex items-center px-3 py-2 ${isAlert ? 'bg-term-blue/10' : 'bg-term-red/10'} border-b ${borderColor} mb-4`}>
          {isAlert ? <Info size={16} className={`mr-2 ${iconColor}`} /> : <AlertTriangle size={16} className={`mr-2 ${iconColor}`} />}
          <h3 className={`font-mono font-bold tracking-widest text-sm ${iconColor}`}>{title}</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-4 text-center">
          <p className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>

        {/* Footer / Buttons */}
        <div className="flex justify-center space-x-4 p-4 border-t border-gray-800">
          {!isAlert && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-600 hover:border-gray-400 text-gray-400 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center"
            >
              <X size={14} className="mr-2" /> Cancel
            </button>
          )}
          
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-6 py-2 border font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center
              ${isAlert 
                ? 'border-term-blue text-term-blue hover:bg-term-blue hover:text-black' 
                : 'border-term-red text-term-red hover:bg-term-red hover:text-black'
              }
            `}
          >
            <Check size={14} className="mr-2" /> {isAlert ? 'OK' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupModal;