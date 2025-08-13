"use client";

import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

interface HandleFormProps {
  currentHandle: string;
  onSuccess?: () => void;
}

export default function HandleForm({ currentHandle, onSuccess }: HandleFormProps) {
  const [handle, setHandle] = useState(currentHandle);
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'saving' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Debounced availability check
  const checkAvailability = useCallback(
    debounce(async (inputHandle: string) => {
      if (inputHandle === currentHandle) {
        setStatus('idle');
        return;
      }

      if (inputHandle.length < 3) {
        setStatus('invalid');
        setErrorMessage('Handle must be at least 3 characters');
        return;
      }

      if (!/^[a-z0-9-]{3,30}$/.test(inputHandle)) {
        setStatus('invalid');
        setErrorMessage('Only lowercase letters, numbers, and dashes allowed');
        return;
      }

      setStatus('checking');
      
      try {
        const response = await fetch(`/api/user/handle/check?handle=${encodeURIComponent(inputHandle)}`);
        const data = await response.json();
        
        if (data.available) {
          setStatus('available');
          setErrorMessage('');
        } else {
          setStatus('taken');
          setErrorMessage('Handle already taken');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Failed to check availability');
      }
    }, 500),
    [currentHandle]
  );

  useEffect(() => {
    if (handle !== currentHandle && handle.length > 0) {
      checkAvailability(handle);
    }
  }, [handle, checkAvailability, currentHandle]);

  const handleSave = async () => {
    if (status !== 'available') return;
    
    setStatus('saving');
    
    try {
      const response = await fetch('/api/user/handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        onSuccess?.();
        // Refresh the page to update the handle throughout the UI
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to update handle');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to update handle');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>;
      case 'available':
        return <span className="text-green-600">✓</span>;
      case 'taken':
      case 'invalid':
      case 'error':
        return <span className="text-red-600">✗</span>;
      case 'success':
        return <span className="text-green-600">✓</span>;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'checking':
        return 'Checking availability...';
      case 'available':
        return 'Available';
      case 'taken':
      case 'invalid':
      case 'error':
        return errorMessage;
      case 'saving':
        return 'Saving...';
      case 'success':
        return 'Handle updated successfully!';
      default:
        return '';
    }
  };

  const canSave = status === 'available' && handle !== currentHandle;
  const isDisabled = status === 'saving' || !canSave;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            placeholder="your-handle"
            className={`w-full rounded-md border px-3 py-2 pr-8 ${
              status === 'available' ? 'border-green-300 focus:border-green-500' :
              status === 'taken' || status === 'invalid' || status === 'error' ? 'border-red-300 focus:border-red-500' :
              'border-gray-300 focus:border-indigo-500'
            } focus:outline-none focus:ring-1 ${
              status === 'available' ? 'focus:ring-green-500' :
              status === 'taken' || status === 'invalid' || status === 'error' ? 'focus:ring-red-500' :
              'focus:ring-indigo-500'
            }`}
            disabled={status === 'saving'}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isDisabled}
          className={`px-4 py-2 rounded-md font-medium ${
            !isDisabled
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {status === 'saving' ? 'Saving...' : 'Save'}
        </button>
      </div>
      
      {/* Status message */}
      {getStatusMessage() && (
        <p className={`text-sm ${
          status === 'available' || status === 'success' ? 'text-green-600' :
          status === 'taken' || status === 'invalid' || status === 'error' ? 'text-red-600' :
          'text-gray-500'
        }`}>
          {getStatusMessage()}
        </p>
      )}
      
      <p className="text-xs text-gray-500">
        Lowercase letters, numbers, and dashes only. 3-30 characters.
      </p>
    </div>
  );
}
