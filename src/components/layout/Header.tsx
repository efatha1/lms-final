import { useAuth } from '../../contexts/AuthContext';
import { Bell, User } from 'lucide-react';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-6 sticky top-0 z-30">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <User className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium">{user?.username || 'User'}</span>
        </div>
      </div>
    </header>
  );
}