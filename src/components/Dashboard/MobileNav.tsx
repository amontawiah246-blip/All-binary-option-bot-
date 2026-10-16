import React from 'react';
import { Cpu, Layers, Radio, Terminal, FileText } from 'lucide-react';

interface MobileNavProps {
  currentTab: 'overview' | 'fleet' | 'three' | 'terminal' | 'reports';
  onTabChange: (tab: 'overview' | 'fleet' | 'three' | 'terminal' | 'reports') => void;
  activeSignalsCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onTabChange,
  activeSignalsCount,
}) => {
  const tabs = [
    { id: 'overview', label: 'CEO', icon: Cpu },
    { id: 'fleet', label: 'Fleet 50', icon: Layers },
    { id: 'three', label: '3D Swarm', icon: Radio },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-2 py-1.5 shadow-2xl">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as any)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {tab.id === 'overview' && activeSignalsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-mono tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full bg-cyan-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
