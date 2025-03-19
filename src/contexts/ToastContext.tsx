import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastType } from '../components/ui/toast';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (type: ToastType, title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: ToastType, title: string, message: string) => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { id, type, title, message }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4">
            <div className="flex items-start">
              {toast.type === 'success' && <div className="w-4 h-4 bg-green-500 rounded-full mr-2 mt-1"></div>}
              {toast.type === 'error' && <div className="w-4 h-4 bg-red-500 rounded-full mr-2 mt-1"></div>}
              {toast.type === 'info' && <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 mt-1"></div>}
              {toast.type === 'warning' && <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2 mt-1"></div>}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{toast.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{toast.message}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};