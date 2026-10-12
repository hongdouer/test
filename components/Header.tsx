
import React from 'react';
import { Bell, UserCircle } from 'lucide-react';

export const Header: React.FC<{ title: string }> = ({ title }) => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 flex items-center justify-end px-8 fixed top-0 left-72 right-0 z-10 transition-all duration-300 print:hidden">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-700">肖虹</p>
              <p className="text-xs text-gray-500 font-medium">产品负责人</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 overflow-hidden shadow-sm">
                <UserCircle className="w-12 h-12 mt-2" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
