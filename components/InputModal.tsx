import React, { useEffect, useRef, useState } from 'react';

interface InputModalProps {
  isOpen: boolean;
  prompt: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

const InputModal: React.FC<InputModalProps> = ({ isOpen, prompt, placeholder, onSubmit, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-10 left-4 right-4 bg-gray-900 border border-term-green shadow-lg p-2 z-50 flex items-center">
      <span className="text-term-green font-bold mr-2 whitespace-nowrap">{prompt}</span>
      <input
        ref={inputRef}
        type="text"
        className="flex-1 bg-transparent border-none outline-none text-term-fg font-mono placeholder-gray-600"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onSubmit(value.trim());
            setValue('');
          } else if (e.key === 'Escape') {
            onCancel();
            setValue('');
          }
        }}
      />
    </div>
  );
};

export default InputModal;