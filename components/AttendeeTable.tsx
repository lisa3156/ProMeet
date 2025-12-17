import React, { useState, useMemo, useRef } from 'react';
import { Attendee, FilterStatus, SortField, SortDirection } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle, 
  Trash,
  Mail,
  FileCheck,
  Plus,
  Copy,
  CornerDownLeft,
  Phone,
  User,
  MoreHorizontal,
  X
} from 'lucide-react';

interface AttendeeTableProps {
  attendees: Attendee[];
  onUpdateAttendee: (id: string, updates: Partial<Attendee>) => void;
  onDeleteAttendees: (ids: string[]) => void;
  onAddAttendee: (data: Partial<Attendee>) => void;
  onDuplicateAttendee: (id: string) => void;
}

export const AttendeeTable: React.FC<AttendeeTableProps> = ({ 
  attendees, 
  onUpdateAttendee,
  onDeleteAttendees,
  onAddAttendee,
  onDuplicateAttendee
}) => {
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>(FilterStatus.ALL);
  const [sortField, setSortField] = useState<SortField>('department');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Mobile Modal State
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);

  // Quick Add State (Desktop & Mobile Modal)
  const [newItem, setNewItem] = useState<Partial<Attendee>>({
    department: '',
    jobTitle: '',
    name: '',
    contactName: '',
    phone: ''
  });
  const deptInputRef = useRef<HTMLInputElement>(null);
  const mobileDeptInputRef = useRef<HTMLInputElement>(null);

  // Derived state for dropdowns (Departments)
  const existingDepartments = useMemo(() => {
    return Array.from(new Set(attendees.map(a => a.department).filter(Boolean))).sort();
  }, [attendees]);

  // Derived state for dropdowns (Job Titles)
  const existingJobTitles = useMemo(() => {
    return Array.from(new Set(attendees.map(a => a.jobTitle).filter(Boolean))).sort();
  }, [attendees]);

  // Filtering Logic
  const filteredAttendees = useMemo(() => {
    return attendees.filter(a => {
      const matchesText = 
        a.name.toLowerCase().includes(filterText.toLowerCase()) || 
        a.department.toLowerCase().includes(filterText.toLowerCase()) ||
        a.contactName?.toLowerCase().includes(filterText.toLowerCase()) ||
        a.phone.includes(filterText);

      if (!matchesText) return false;

      switch (statusFilter) {
        case FilterStatus.PRESENT: return a.status === 'present';
        case FilterStatus.LEAVE: return a.status === 'leave';
        case FilterStatus.PENDING: return a.status === 'pending';
        case FilterStatus.NOTIFIED: return a.isNotified;
        case FilterStatus.NOT_NOTIFIED: return !a.isNotified;
        case FilterStatus.RSVP_YES: return a.hasRsvp;
        case FilterStatus.RSVP_NO: return !a.hasRsvp;
        default: return true;
      }
    });
  }, [attendees, filterText, statusFilter]);

  // Sorting Logic
  const sortedAttendees = useMemo(() => {
    return [...filteredAttendees].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      
      if (sortDirection === 'desc') {
        return valA < valB ? 1 : -1;
      }
      return valA > valB ? 1 : -1;
    });
  }, [filteredAttendees, sortField, sortDirection]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedAttendees.length && sortedAttendees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAttendees.map(a => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // Batch Actions
  const handleBatchUpdate = (field: keyof Attendee, value: any) => {
    selectedIds.forEach(id => onUpdateAttendee(id, { [field]: value }));
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    if (window.confirm(`确定要删除这 ${selectedIds.size} 位参会人员吗？`)) {
      onDeleteAttendees(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Logic: Autofill contact/phone based on department
  const autofillFromDepartment = (dept: string, isQuickAdd: boolean, rowId?: string) => {
    if (!dept) return;

    // Find first existing attendee in CURRENT meeting with this department
    const match = attendees.find(a => a.department === dept && (rowId ? a.id !== rowId : true));
    
    if (match) {
      if (isQuickAdd) {
        setNewItem(prev => ({
            ...prev,
            department: dept,
            contactName: match.contactName,
            phone: match.phone
        }));
      } else if (rowId) {
        onUpdateAttendee(rowId, { 
            department: dept,
            contactName: match.contactName,
            phone: match.phone
        });
      }
    } else {
        // Just update the department if no match found
        if (isQuickAdd) {
            setNewItem(prev => ({ ...prev, department: dept }));
        } else if (rowId) {
            onUpdateAttendee(rowId, { department: dept });
        }
    }
  };

  // Quick Add Handlers
  const handleQuickAdd = (fromMobile = false) => {
    if (!newItem.department?.trim() && !newItem.name?.trim()) return;
    
    onAddAttendee({
      ...newItem,
      isNotified: false,
      hasRsvp: false,
      status: 'pending'
    });
    
    const resetState = { 
        department: newItem.department, 
        jobTitle: newItem.jobTitle, 
        contactName: newItem.contactName,
        phone: newItem.phone,
        name: '' 
    };

    setNewItem(resetState); 
    
    if (fromMobile) {
        setIsMobileAddOpen(false); // Close modal on mobile
    } else {
        if (deptInputRef.current) deptInputRef.current.focus();
    }
  };

  const handleQuickAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickAdd();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent md:bg-white rounded-lg shadow-none md:shadow-sm md:border border-slate-200">
      
      {/* Mobile Add Modal */}
      {isMobileAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">添加参会人员</h3>
                    <button onClick={() => setIsMobileAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto space-y-4">
                     <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">部门</label>
                        <input 
                            ref={mobileDeptInputRef}
                            list="dept-options-mobile"
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="输入或选择部门"
                            value={newItem.department}
                            onChange={e => autofillFromDepartment(e.target.value, true)}
                        />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">职务</label>
                        <input 
                            list="title-options-mobile"
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="输入或选择职务"
                            value={newItem.jobTitle}
                            onChange={e => setNewItem({...newItem, jobTitle: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">姓名</label>
                        <input 
                            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            placeholder="参会人姓名"
                            value={newItem.name}
                            onChange={e => setNewItem({...newItem, name: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">联系人</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="部门联系人"
                                value={newItem.contactName}
                                onChange={e => setNewItem({...newItem, contactName: e.target.value})}
                            />
                         </div>
                         <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">联系电话</label>
                            <input 
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="手机或座机"
                                value={newItem.phone}
                                onChange={e => setNewItem({...newItem, phone: e.target.value})}
                            />
                         </div>
                     </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                    <button 
                        onClick={() => handleQuickAdd(true)}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg shadow hover:bg-blue-700 active:scale-95 transition-transform"
                    >
                        确认添加
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-3 md:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white md:bg-slate-50/50 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索..." 
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <div className="relative">
             <select 
              className="appearance-none pl-9 pr-8 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-[40px] md:w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
             >
               <option value={FilterStatus.ALL}>所有</option>
               <option value={FilterStatus.PRESENT}>出席</option>
               <option value={FilterStatus.LEAVE}>请假</option>
               <option value={FilterStatus.PENDING}>待定</option>
               <option value={FilterStatus.NOTIFIED}>已通知</option>
               <option value={FilterStatus.RSVP_YES}>已回执</option>
             </select>
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200 overflow-x-auto pb-1 md:pb-0">
             <span className="hidden md:inline text-sm font-medium text-slate-600 mr-2">已选 {selectedIds.size}</span>
             <button onClick={() => handleBatchUpdate('isNotified', true)} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"><Mail className="w-3.5 h-3.5"/> <span className="hidden md:inline">批量</span>通知</button>
             <button onClick={() => handleBatchUpdate('hasRsvp', true)} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-xs font-medium"><FileCheck className="w-3.5 h-3.5"/> <span className="hidden md:inline">批量</span>回执</button>
             <button onClick={() => handleBatchUpdate('status', 'present')} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-xs font-medium"><CheckCircle className="w-3.5 h-3.5"/> <span className="hidden md:inline">批量</span>出席</button>
             <button onClick={handleBatchDelete} className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"><Trash className="w-3.5 h-3.5"/> <span className="hidden md:inline">批量</span>删除</button>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-slate-100 md:bg-white">
        
        {/* DESKTOP TABLE VIEW */}
        <table className="hidden md:table w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="p-4 w-10 border-b border-slate-200">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selectedIds.size === sortedAttendees.length && sortedAttendees.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="p-3 border-b border-slate-200 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors w-[15%]" onClick={() => handleSort('department')}>
                <div className="flex items-center gap-1">部门 <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
               <th className="p-3 border-b border-slate-200 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors w-[12%]" onClick={() => handleSort('jobTitle')}>
                <div className="flex items-center gap-1">职务 <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="p-3 border-b border-slate-200 font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors w-[12%]" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">姓名 <ArrowUpDown className="w-3 h-3 text-slate-400" /></div>
              </th>
              <th className="p-3 border-b border-slate-200 font-semibold text-slate-600 w-[12%]">联系人</th>
              <th className="p-3 border-b border-slate-200 font-semibold text-slate-600 w-[15%]">联系电话</th>
              <th className="p-3 border-b border-slate-200 font-semibold text-slate-600 text-center w-[18%]">状态</th>
              <th className="p-3 border-b border-slate-200 font-semibold text-slate-600 w-[10%] text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Quick Add Row - Always at top of body */}
            <tr className="bg-blue-50/60 border-b-2 border-blue-100 group">
                <td className="p-4 text-center">
                    <div className="w-4 h-4 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center mx-auto">
                        <Plus className="w-3 h-3" />
                    </div>
                </td>
                <td className="p-3">
                    <input 
                        ref={deptInputRef}
                        list="dept-options"
                        placeholder="部门..."
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        value={newItem.department}
                        onChange={e => autofillFromDepartment(e.target.value, true)}
                        onKeyDown={handleQuickAddKeyDown}
                    />
                </td>
                <td className="p-3">
                    <input 
                        list="title-options"
                        placeholder="职务..."
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        value={newItem.jobTitle}
                        onChange={e => setNewItem({...newItem, jobTitle: e.target.value})}
                        onKeyDown={handleQuickAddKeyDown}
                    />
                </td>
                <td className="p-3">
                     <input 
                        placeholder="姓名..."
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm placeholder:text-slate-400 font-medium"
                        value={newItem.name}
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                        onKeyDown={handleQuickAddKeyDown}
                    />
                </td>
                <td className="p-3">
                    <input 
                        placeholder="联系人..."
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        value={newItem.contactName}
                        onChange={e => setNewItem({...newItem, contactName: e.target.value})}
                        onKeyDown={handleQuickAddKeyDown}
                    />
                </td>
                <td className="p-3">
                    <input 
                        placeholder="电话..."
                        className="w-full bg-white border border-blue-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all shadow-sm placeholder:text-slate-400"
                        value={newItem.phone}
                        onChange={e => setNewItem({...newItem, phone: e.target.value})}
                        onKeyDown={handleQuickAddKeyDown}
                    />
                </td>
                <td className="p-3 text-center text-xs text-blue-500 italic">
                    待添加 (按回车)
                </td>
                <td className="p-3 flex justify-end">
                    <span className="p-2 text-blue-300">
                        <CornerDownLeft className="w-4 h-4" />
                    </span>
                </td>
            </tr>

            {sortedAttendees.map(a => (
              <tr key={a.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(a.id) ? 'bg-blue-50' : ''}`}>
                 <td className="p-4 w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelectOne(a.id)}
                    />
                  </td>
                  
                  <td className="p-3">
                    <input 
                      list="dept-options"
                      type="text" 
                      className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 focus:ring-2 focus:ring-blue-100 outline-none transition-all truncate"
                      value={a.department}
                      onChange={(e) => autofillFromDepartment(e.target.value, false, a.id)}
                    />
                  </td>

                   <td className="p-3">
                    <input 
                      list="title-options"
                      type="text" 
                      className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 focus:ring-2 focus:ring-blue-100 outline-none transition-all truncate"
                      value={a.jobTitle}
                      onChange={(e) => onUpdateAttendee(a.id, { jobTitle: e.target.value })}
                    />
                  </td>

                  <td className="p-3">
                    <input 
                      type="text" 
                      className="w-full font-medium text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      value={a.name}
                      onChange={(e) => onUpdateAttendee(a.id, { name: e.target.value })}
                    />
                  </td>

                  <td className="p-3">
                    <input 
                      type="text" 
                      className="w-full text-slate-600 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      value={a.contactName}
                      onChange={(e) => onUpdateAttendee(a.id, { contactName: e.target.value })}
                    />
                  </td>

                   <td className="p-3">
                    <input 
                      type="text" 
                      className="w-full text-slate-500 bg-transparent border border-transparent hover:border-slate-300 focus:bg-white focus:border-blue-400 rounded px-2 py-1 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      value={a.phone}
                      onChange={(e) => onUpdateAttendee(a.id, { phone: e.target.value })}
                    />
                  </td>

                  {/* Combined Status/Flags */}
                  <td className="p-3">
                     <div className="flex flex-col gap-1.5">
                         <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={() => onUpdateAttendee(a.id, { isNotified: !a.isNotified })}
                                className={`p-1 rounded ${a.isNotified ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:text-blue-400'}`}
                                title="是否已通知"
                            >
                                <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={() => onUpdateAttendee(a.id, { hasRsvp: !a.hasRsvp })}
                                className={`p-1 rounded ${a.hasRsvp ? 'bg-indigo-100 text-indigo-600' : 'text-slate-300 hover:text-indigo-400'}`}
                                title="是否已回执"
                            >
                                <FileCheck className="w-3.5 h-3.5" />
                            </button>
                         </div>
                         <select 
                            className={`w-full text-[10px] font-semibold py-0.5 px-1 rounded border focus:outline-none focus:ring-1 ${
                            a.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            a.status === 'leave' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                            value={a.status}
                            onChange={(e) => onUpdateAttendee(a.id, { status: e.target.value as any })}
                        >
                            <option value="pending">待定</option>
                            <option value="present">出席</option>
                            <option value="leave">请假</option>
                        </select>
                        {a.status === 'leave' && (
                             <input 
                                type="text"
                                placeholder="事由"
                                className="text-[10px] w-full bg-white border border-amber-100 rounded px-1 py-0.5"
                                value={a.leaveReason || ''}
                                onChange={(e) => onUpdateAttendee(a.id, { leaveReason: e.target.value })}
                            />
                        )}
                     </div>
                  </td>
                  
                  {/* Row Actions */}
                  <td className="p-3">
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button 
                            onClick={() => onDuplicateAttendee(a.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="复制人员"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={() => onDeleteAttendees([a.id])}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                        >
                            <Trash className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MOBILE CARD VIEW */}
        <div className="md:hidden p-3 space-y-3 pb-24">
            {sortedAttendees.map(a => (
                <div key={a.id} className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex flex-col gap-3">
                    {/* Header: Name and Status */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                             <input 
                                type="checkbox" 
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-5 h-5 mr-1"
                                checked={selectedIds.has(a.id)}
                                onChange={() => toggleSelectOne(a.id)}
                            />
                            <div>
                                <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    {a.name || <span className="text-slate-300 italic">未命名</span>}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                        a.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                        a.status === 'leave' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}>
                                        {a.status === 'present' ? '出席' : a.status === 'leave' ? '请假' : '待定'}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 mt-0.5">
                                    {a.department} {a.jobTitle && `· ${a.jobTitle}`}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                             <button 
                                onClick={() => onDeleteAttendees([a.id])}
                                className="p-2 text-slate-400 bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-600"
                             >
                                <Trash className="w-4 h-4" />
                             </button>
                        </div>
                    </div>

                    {/* Contact Info Row */}
                    {(a.contactName || a.phone) && (
                        <div className="flex items-center gap-4 text-sm bg-slate-50 p-2 rounded text-slate-600">
                             {a.contactName && (
                                <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{a.contactName}</span>
                                </div>
                             )}
                             {a.phone && (
                                 <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                    <a href={`tel:${a.phone}`} className="underline decoration-slate-300">{a.phone}</a>
                                 </div>
                             )}
                        </div>
                    )}
                    
                    {/* Status Actions */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
                        <div className="flex gap-3">
                            <button 
                                onClick={() => onUpdateAttendee(a.id, { isNotified: !a.isNotified })}
                                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${a.isNotified ? 'bg-blue-100 text-blue-700' : 'text-slate-400 bg-slate-50'}`}
                            >
                                <Mail className="w-3.5 h-3.5" />
                                通知
                            </button>
                            <button 
                                onClick={() => onUpdateAttendee(a.id, { hasRsvp: !a.hasRsvp })}
                                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${a.hasRsvp ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 bg-slate-50'}`}
                            >
                                <FileCheck className="w-3.5 h-3.5" />
                                回执
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {a.status !== 'present' && (
                                <button onClick={() => onUpdateAttendee(a.id, { status: 'present' })} className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded">
                                    设为出席
                                </button>
                            )}
                            {a.status !== 'leave' && (
                                <button onClick={() => onUpdateAttendee(a.id, { status: 'leave' })} className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded">
                                    设为请假
                                </button>
                            )}
                        </div>
                    </div>
                     {a.status === 'leave' && (
                        <input 
                        type="text"
                        placeholder="请输入请假事由..."
                        className="text-xs w-full bg-amber-50/50 border border-amber-100 rounded px-2 py-1.5 text-amber-800 placeholder:text-amber-300 focus:outline-none"
                        value={a.leaveReason || ''}
                        onChange={(e) => onUpdateAttendee(a.id, { leaveReason: e.target.value })}
                    />
                    )}
                </div>
            ))}
             {sortedAttendees.length === 0 && (
                 <div className="text-center py-10 text-slate-400">
                    <p>暂无参会人员</p>
                    <p className="text-xs mt-1">点击右下角按钮添加</p>
                 </div>
             )}
        </div>

        {/* Mobile Floating Action Button */}
        <button 
            onClick={() => setIsMobileAddOpen(true)}
            className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 flex items-center justify-center z-40 active:scale-90 transition-transform"
        >
            <Plus className="w-8 h-8" />
        </button>

        {/* Datalists for Autocomplete */}
        <datalist id="dept-options">
            {existingDepartments.map(d => <option key={d} value={d} />)}
        </datalist>
        <datalist id="dept-options-mobile">
            {existingDepartments.map(d => <option key={d} value={d} />)}
        </datalist>
        <datalist id="title-options">
            {existingJobTitles.map(t => <option key={t} value={t} />)}
        </datalist>
        <datalist id="title-options-mobile">
            {existingJobTitles.map(t => <option key={t} value={t} />)}
        </datalist>
      </div>
      
      {/* Footer / Summary - Hidden on mobile, simplified */}
      <div className="hidden md:flex p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 justify-between items-center">
        <div>总计: <strong>{attendees.length}</strong></div>
        <div className="flex gap-4">
          <span>出席: <strong>{attendees.filter(a => a.status === 'present').length}</strong></span>
          <span>请假: <strong>{attendees.filter(a => a.status === 'leave').length}</strong></span>
          <span>待定: <strong>{attendees.filter(a => a.status === 'pending').length}</strong></span>
        </div>
      </div>
      
      {/* Mobile Footer Summary */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 text-[10px] text-slate-500 flex justify-around items-center z-30">
          <span>总计: <strong>{attendees.length}</strong></span>
          <span>出席: <strong>{attendees.filter(a => a.status === 'present').length}</strong></span>
          <span>请假: <strong>{attendees.filter(a => a.status === 'leave').length}</strong></span>
      </div>
    </div>
  );
};