import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  Calendar, 
  BarChart2,
  Menu,
  X
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: 'Loan Applications',
      path: '/loan-applications',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: 'Cash Flow',
      path: '/cash-flow',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      name: 'Repayments',
      path: '/repayments',
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart2 className="h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">LMS</span>
          </Link>
          <button
            className="lg:hidden text-gray-500 hover:text-gray-600 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6 px-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}