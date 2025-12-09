import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Trash2, Download, Upload, User, Users, Briefcase, Archive, ArrowRight, Save as SaveIcon } from 'lucide-react';
import { archiveManager } from '../utils/archiveManager';

const GROUPS = [
    { id: 'all', label: '全部', icon: Archive },
    { id: 'family', label: '家人', icon: Users },
    { id: 'friend', label: '朋友', icon: User },
    { id: 'customer', label: '客户', icon: Briefcase },
    { id: 'other', label: '其他', icon: Filter },
];

export default function ArchiveView({ onBack, onLoadRecord }) {
    const [records, setRecords] = useState([]);
    const [activeGroup, setActiveGroup] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    // Load records on mount
    useEffect(() => {
        setRecords(archiveManager.getRecords());

        // Listen for external updates (e.g. save from another tab)
        const handleUpdate = () => setRecords(archiveManager.getRecords());
        window.addEventListener('archive-updated', handleUpdate);
        return () => window.removeEventListener('archive-updated', handleUpdate);
    }, []);

    // Filter logic
    const filteredRecords = useMemo(() => {
        return records.filter(rec => {
            const matchGroup = activeGroup === 'all' || rec.group === activeGroup;
            const matchSearch = !searchQuery ||
                rec.name.includes(searchQuery) ||
                (rec.note && rec.note.includes(searchQuery));
            return matchGroup && matchSearch;
        });
    }, [records, activeGroup, searchQuery]);

    // Handlers
    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('确定要删除这条档案吗？此操作无法撤销。')) {
            archiveManager.deleteRecord(id);
            setRecords(archiveManager.getRecords()); // Refresh
        }
    };

    const handleBackup = () => {
        archiveManager.exportData();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = archiveManager.importData(ev.target.result);
            if (result.success) {
                alert(`成功导入 ${result.count} 条档案！`);
                setRecords(archiveManager.getRecords());
            } else {
                alert('导入失败：文件格式不正确');
            }
        };
        reader.readAsText(file);
        // Reset file input
        e.target.value = null;
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050505] text-gray-100 overflow-hidden animate-in fade-in duration-300">
            {/* Top Bar */}
            <div className="p-4 bg-black/50 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Archive className="w-5 h-5 text-cyan-400" />
                    档案管理
                </h2>
                <div className="flex gap-2">
                    <label className="p-2 bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-white/10 transition-colors text-xs flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        导入
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                    </label>
                    <button
                        onClick={handleBackup}
                        className="p-2 bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-white/10 transition-colors text-xs flex items-center gap-1 text-cyan-400"
                    >
                        <Download className="w-3 h-3" />
                        备份
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="p-4 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="搜索姓名或备注..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-cyan-500/50 outline-none transition-all"
                    />
                </div>

                {/* Groups */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {GROUPS.map(group => {
                        const Icon = group.icon;
                        const isActive = activeGroup === group.id;
                        return (
                            <button
                                key={group.id}
                                onClick={() => setActiveGroup(group.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                    ${isActive
                                        ? 'bg-cyan-900/40 border-cyan-500/50 text-cyan-300'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Icon className="w-3 h-3" />
                                {group.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-2">
                {filteredRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                        <Archive className="w-8 h-8 mb-2 opacity-20" />
                        <p>暂无档案</p>
                    </div>
                ) : (
                    filteredRecords.map(rec => (
                        <div
                            key={rec.id}
                            onClick={() => onLoadRecord(rec)}
                            className="group relative bg-[#111] border border-white/5 rounded-lg p-3 flex flex-col gap-2 hover:border-cyan-500/30 transition-all cursor-pointer active:scale-[0.99]"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className={`w-1 h-12 rounded-full ${rec.gender === 'male' ? 'bg-cyan-500' : 'bg-pink-500'}`}></span>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{rec.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono">
                                            {rec.type === 'ziwei' ? '紫微' : '占卜'} · {rec.solarDate} · {rec.timeHour}时
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, rec.id)}
                                    className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {rec.note && (
                                <div className="text-xs text-gray-500 bg-black/30 p-2 rounded truncate">
                                    备注: {rec.note}
                                </div>
                            )}

                            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-500 text-xs flex items-center gap-1 font-bold">
                                排盘 <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Legend or Stats? No, keep clean. */}
        </div>
    );
}
