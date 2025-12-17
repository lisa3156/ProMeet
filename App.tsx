import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { AttendeeTable } from './components/AttendeeTable';
import { Meeting, Attendee } from './types';
import { INITIAL_MEETING_TITLE, EMPTY_ATTENDEE } from './constants';
import { exportToExcel, importFromExcel } from './utils/excelService';
import { 
  Download, 
  Upload, 
  UserPlus, 
  Calendar,
  PieChart,
  Menu
} from 'lucide-react';

const App: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('promeet_data');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Derived current meeting
  const currentMeeting = meetings.find(m => m.id === currentMeetingId);

  // Persistence
  useEffect(() => {
    localStorage.setItem('promeet_data', JSON.stringify(meetings));
  }, [meetings]);

  // Actions
  const createMeeting = () => {
    const newMeeting: Meeting = {
      id: uuidv4(),
      title: `${INITIAL_MEETING_TITLE} ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString().split('T')[0],
      attendees: [],
      createdAt: Date.now()
    };
    setMeetings([newMeeting, ...meetings]);
    setCurrentMeetingId(newMeeting.id);
  };

  const deleteMeeting = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("确定要删除整条会议记录吗？")) {
      setMeetings(prev => prev.filter(m => m.id !== id));
      if (currentMeetingId === id) setCurrentMeetingId(null);
    }
  };

  const updateMeetingDetails = (updates: Partial<Meeting>) => {
    if (!currentMeetingId) return;
    setMeetings(prev => prev.map(m => m.id === currentMeetingId ? { ...m, ...updates } : m));
  };

  const addAttendee = (initialData?: Partial<Attendee>) => {
    if (!currentMeetingId) return;
    const newAttendee: Attendee = { 
        ...EMPTY_ATTENDEE, 
        ...initialData,
        id: uuidv4() 
    };
    setMeetings(prev => prev.map(m => {
      if (m.id === currentMeetingId) {
        // If it's a quick add (has data), put at top for visibility
        // If it's empty (button click), also top
        return { ...m, attendees: [newAttendee, ...m.attendees] };
      }
      return m;
    }));
  };

  const duplicateAttendee = (attendeeId: string) => {
    if (!currentMeetingId) return;
    setMeetings(prev => prev.map(m => {
      if (m.id === currentMeetingId) {
        const index = m.attendees.findIndex(a => a.id === attendeeId);
        if (index === -1) return m;

        const original = m.attendees[index];
        const copy: Attendee = {
            ...original,
            id: uuidv4(),
            name: "", // Clear name for easy entry of new person
            isNotified: false,
            hasRsvp: false,
            status: 'pending',
            leaveReason: ''
        };

        const newAttendees = [...m.attendees];
        newAttendees.splice(index + 1, 0, copy); // Insert right after
        return { ...m, attendees: newAttendees };
      }
      return m;
    }));
  };

  const updateAttendee = useCallback((attendeeId: string, updates: Partial<Attendee>) => {
    setMeetings(prev => prev.map(m => {
      if (m.id === currentMeetingId) {
        return {
          ...m,
          attendees: m.attendees.map(a => a.id === attendeeId ? { ...a, ...updates } : a)
        };
      }
      return m;
    }));
  }, [currentMeetingId]);

  const deleteAttendees = (ids: string[]) => {
    if (!currentMeetingId) return;
    setMeetings(prev => prev.map(m => {
      if (m.id === currentMeetingId) {
        return { ...m, attendees: m.attendees.filter(a => !ids.includes(a.id)) };
      }
      return m;
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentMeetingId) return;
    try {
      const importedData = await importFromExcel(e.target.files[0]);
      // Convert partials to full attendees
      const newAttendees: Attendee[] = importedData.map(d => ({
        ...EMPTY_ATTENDEE,
        ...d,
        id: uuidv4(),
        // Ensure enums are valid
        status: (['present', 'leave', 'pending'].includes(d.status as string) ? d.status : 'pending') as any
      }));
      
      setMeetings(prev => prev.map(m => {
        if (m.id === currentMeetingId) {
          return { ...m, attendees: [...m.attendees, ...newAttendees] };
        }
        return m;
      }));
      
      e.target.value = ''; // Reset input
    } catch (err) {
      console.error(err);
      alert("Excel导入失败，请检查文件格式。");
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      <Sidebar 
        meetings={meetings}
        currentMeetingId={currentMeetingId}
        onSelectMeeting={setCurrentMeetingId}
        onCreateMeeting={createMeeting}
        onDeleteMeeting={deleteMeeting}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header Toggle */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-20">
             <div className="flex items-center gap-3">
                 <button onClick={() => setSidebarOpen(true)} className="p-1 -ml-1 text-slate-600">
                    <Menu className="w-6 h-6" />
                 </button>
                 <span className="font-bold text-slate-800">ProMeet</span>
             </div>
        </div>

        {currentMeeting ? (
          <>
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 md:py-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-20 gap-4">
              <div className="w-full md:w-auto">
                <input 
                  className="text-xl md:text-2xl font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-300 rounded px-1 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all w-full md:max-w-lg"
                  value={currentMeeting.title}
                  onChange={(e) => updateMeetingDetails({ title: e.target.value })}
                />
                <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm pl-1">
                   <Calendar className="w-4 h-4" />
                   <input 
                      type="date"
                      className="bg-transparent hover:text-slate-800 cursor-pointer focus:outline-none"
                      value={currentMeeting.date}
                      onChange={(e) => updateMeetingDetails({ date: e.target.value })}
                   />
                </div>
              </div>

              <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap">
                <label className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 cursor-pointer transition-colors border border-slate-300 shadow-sm text-xs md:text-sm font-medium">
                   <Upload className="w-4 h-4" />
                   <span className="hidden md:inline">导入</span>
                   <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
                
                <button 
                  onClick={() => exportToExcel(currentMeeting.title, currentMeeting.attendees)}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors border border-slate-300 shadow-sm text-xs md:text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                   <span className="hidden md:inline">导出</span>
                </button>

                <div className="h-6 w-px bg-slate-300 mx-1 hidden md:block"></div>

                <button 
                  onClick={() => addAttendee()}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-all text-sm font-medium transform active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  空白行
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-2 md:p-6 overflow-hidden bg-slate-50 md:bg-white">
               <AttendeeTable 
                  attendees={currentMeeting.attendees}
                  onUpdateAttendee={updateAttendee}
                  onDeleteAttendees={deleteAttendees}
                  onAddAttendee={addAttendee}
                  onDuplicateAttendee={duplicateAttendee}
               />
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-4">
             <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <PieChart className="w-12 h-12 text-slate-400" />
             </div>
             <h2 className="text-xl font-semibold text-slate-600">未选择会议</h2>
             <p className="mt-2 max-w-sm text-center text-sm md:text-base">请在左侧选择历史会议或新建会议以开始管理。</p>
             <button 
                onClick={createMeeting}
                className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-all font-medium"
             >
               新建会议
             </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;