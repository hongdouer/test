import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UnderConstructionProps {
  title: string;
  description?: string;
}

export const UnderConstruction: React.FC<UnderConstructionProps> = ({ 
  title, 
  description = "该功能模块正在紧锣密鼓地开发中，敬请期待..." 
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
      <div className="bg-gray-100 p-8 rounded-full mb-6">
        <Construction size={64} className="text-gray-400" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-3">{title}</h2>
      <p className="text-gray-500 text-lg mb-8 max-w-md text-center">{description}</p>
      
      <button 
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
      >
        <ArrowLeft size={18} />
        返回工作台
      </button>
    </div>
  );
};