import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface PageContainerProps {
  children: ReactNode;
  title: string;
}

export function PageContainer({ children, title }: PageContainerProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col lg:ml-64">
        <Header />
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
          
          {children}
        </main>
      </div>
    </div>
  );
}