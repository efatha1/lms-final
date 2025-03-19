import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  DollarSign, 
  Calendar, 
  BarChart2, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/loan-applications', icon: FileText, label: 'Loan Applications' },
  { path: '/cash-flow', icon: DollarSign, label: 'Cash Flow' },
  { path: '/repayments', icon: Calendar, label: 'Repayments' },
  { path: '/reports', icon: BarChart2, label: 'Reports' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white"
        onClick={toggleSidebar}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">Loan Management</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center p-3 rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-white"
                    : "text-gray-300 hover:bg-gray-800"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={logout}
              className="flex items-center w-full p-3 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}