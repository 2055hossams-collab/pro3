import React from 'react';
import { LayoutDashboard, Users, FlaskConical, ClipboardList, Settings, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'patients', label: 'إدارة المرضى', icon: Users },
    { id: 'tests', label: 'دليل الفحوصات', icon: FlaskConical },
    { id: 'visits', label: 'إدخال النتائج', icon: ClipboardList },
    { id: 'analytics', label: 'التحليلات الذكية', icon: Activity },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed right-0 top-0 shadow-xl z-20 hidden md:flex">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg">المختبر الذكي</h1>
          <p className="text-xs text-slate-400">نظام إدارة متكامل</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              activeTab === item.id
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-4 py-2">
          <Settings className="w-5 h-5" />
          <span>الإعدادات</span>
        </button>
      </div>
    </div>
  );
};
