import React from 'react';
import { Meeting } from '../types';
import { Plus, Calendar, ChevronRight, LayoutDashboard, Trash2, X } from 'lucide-react';

interface SidebarProps {
  meetings: Meeting[];
  currentMeetingId: string | null;
  onSelectMeeting: (id: string) => void;
  onCreateMeeting: () => void;
  onDeleteMeeting: (id: string, e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  meetings, 
  currentMeetingId, 
  onSelectMeeting, 
  onCreateMeeting,
  onDeleteMeeting,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-500" />
            ProMeet
          </h1>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-2 pt-1 md:hidden">
            <p className="text-xs text-slate-500">企业会议登记系统</p>
        </div>

        <div className="p-4">
          <button 
            onClick={() => {
              onCreateMeeting();
              onClose(); // Close sidebar on mobile after action
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            新建会议
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">历史记录</h3>
          <ul className="space-y-1">
            {meetings.length === 0 && (
               <li className="px-2 text-sm text-slate-600 italic">暂无会议记录。</li>
            )}
            {meetings.map((meeting) => (
              <li key={meeting.id} className="group relative">
                <button
                  onClick={() => {
                    onSelectMeeting(meeting.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-md text-sm transition-all ${
                    currentMeetingId === meeting.id 
                      ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                      : 'hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Calendar className={`w-4 h-4 flex-shrink-0 ${currentMeetingId === meeting.id ? 'text-blue-400' : 'text-slate-500'}`} />
                    <div className="truncate">
                      <div className="font-medium truncate">{meeting.title}</div>
                      <div className="text-xs text-slate-500">{meeting.date}</div>
                    </div>
                  </div>
                  {currentMeetingId === meeting.id && <ChevronRight className="w-3 h-3 text-slate-500" />}
                </button>
                
                {/* Delete button appears on hover (desktop) or always visible if active (mobile logic handled by layout) */}
                <button 
                  onClick={(e) => onDeleteMeeting(meeting.id, e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded"
                  title="删除会议"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          v1.1.0 Mobile &copy; ProMeet
        </div>
      </div>
    </>
  );
};