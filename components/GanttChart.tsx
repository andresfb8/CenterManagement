import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { Task } from '../types';
import { Lock, AlertCircle, Calendar, ChevronDown, ChevronRight, Layers, Filter, CheckSquare, Square, X } from 'lucide-react';

export const GanttChart = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { state, openTaskModal } = context;

    // --- Filter State ---
    const [hiddenPhases, setHiddenPhases] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const togglePhase = (id: string) => {
        const next = new Set(hiddenPhases);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setHiddenPhases(next);
    };

    const toggleAll = () => {
        if (hiddenPhases.size > 0) {
            setHiddenPhases(new Set()); // Show all
        } else {
            const allIds = state.subProjects.map(sp => sp.id).concat(['other']);
            setHiddenPhases(new Set(allIds));
        }
    };

    // 1. Filter tasks
    const filteredTasks = useMemo(() => {
        return state.tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(state.searchQuery.toLowerCase());
            const phaseId = t.subProjectId || 'other';
            // Check if phase is hidden
            if (hiddenPhases.has(phaseId)) return false;
            // Check if orphan and 'other' is hidden
            if (!t.subProjectId && hiddenPhases.has('other')) return false;
            
            return matchesSearch;
        }).sort((a, b) => a.createdAt - b.createdAt);
    }, [state.tasks, state.searchQuery, hiddenPhases]);

    // 2. Calculate Timeline Range
    const { minDate, totalDays } = useMemo(() => {
        if (filteredTasks.length === 0) return { minDate: Date.now(), totalDays: 30 };

        const timestamps = filteredTasks.flatMap(t => [t.createdAt, t.dueDate]);
        const min = Math.min(...timestamps);
        const max = Math.max(...timestamps);
        
        const bufferDays = 7;
        const bufferMs = bufferDays * 86400000;
        
        const start = min - bufferMs;
        const end = max + bufferMs;
        
        return { 
            minDate: start, 
            totalDays: Math.ceil((end - start) / 86400000)
        };
    }, [filteredTasks]);

    const COLUMN_WIDTH = 280; // Width of the sticky task column
    const DAY_WIDTH = 50; 
    const TOTAL_WIDTH = totalDays * DAY_WIDTH;

    // 3. Helper to position bars
    const getPosition = (ts: number) => {
        const daysFromStart = (ts - minDate) / 86400000;
        return daysFromStart * DAY_WIDTH;
    };

    const datesArray = useMemo(() => {
        const arr = [];
        for (let i = 0; i < totalDays; i++) {
            arr.push(new Date(minDate + i * 86400000));
        }
        return arr;
    }, [minDate, totalDays]);

    // Group tasks by SubProject
    const groupedTasks = state.subProjects.map(sp => ({
        subProject: sp,
        tasks: filteredTasks.filter(t => t.subProjectId === sp.id)
    })).filter(g => g.tasks.length > 0); // Hide empty groups

    // Add a group for tasks without valid subproject
    const orphanTasks = filteredTasks.filter(t => !state.subProjects.find(sp => sp.id === t.subProjectId));
    if (orphanTasks.length > 0) {
        groupedTasks.push({
            subProject: { id: 'other', name: 'Sin Clasificar', description: '', color: '#f3f4f6' },
            tasks: orphanTasks
        });
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 px-1" ref={filterRef}>
                <div className="relative">
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isFilterOpen ? 'bg-blue-100 text-blue-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Filter size={16} />
                        Filtrar Fases
                        {hiddenPhases.size > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                {state.subProjects.length + 1 - hiddenPhases.size}
                            </span>
                        )}
                        <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}/>
                    </button>

                    {isFilterOpen && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <span className="text-xs font-bold text-gray-500 uppercase">Fases Visibles</span>
                                <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                                    {hiddenPhases.size > 0 ? 'Mostrar Todas' : 'Ocultar Todas'}
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                                {state.subProjects.map(sp => (
                                    <button
                                        key={sp.id}
                                        onClick={() => togglePhase(sp.id)}
                                        className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors"
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!hiddenPhases.has(sp.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                                            {!hiddenPhases.has(sp.id) && <CheckSquare size={14} />}
                                        </div>
                                        <span className={`text-sm flex-1 truncate ${hiddenPhases.has(sp.id) ? 'text-gray-400' : 'text-gray-700'}`}>{sp.name}</span>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sp.color }}></div>
                                    </button>
                                ))}
                                {/* Orphan Option */}
                                <button
                                    onClick={() => togglePhase('other')}
                                    className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg text-left transition-colors border-t border-gray-100 mt-1"
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!hiddenPhases.has('other') ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                                        {!hiddenPhases.has('other') && <CheckSquare size={14} />}
                                    </div>
                                    <span className={`text-sm flex-1 truncate ${hiddenPhases.has('other') ? 'text-gray-400' : 'text-gray-700'}`}>Sin Clasificar</span>
                                    <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="text-xs text-gray-400">
                    {filteredTasks.length} tareas visibles
                </div>
            </div>

            {filteredTasks.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">
                    <Layers size={48} className="mb-4 opacity-20"/>
                    <p>No hay tareas visibles con los filtros actuales.</p>
                </div>
            ) : (
                <div className="flex-1 w-full overflow-auto bg-white rounded-xl shadow-sm border border-gray-200 relative">
                    
                    <div style={{ minWidth: `${COLUMN_WIDTH + TOTAL_WIDTH}px` }}>
                        
                        {/* Header Row (Sticky Top) */}
                        <div className="flex sticky top-0 z-30 bg-gray-50 border-b border-gray-200 shadow-sm h-14">
                            {/* Corner Cell */}
                            <div 
                                className="sticky left-0 z-40 bg-gray-50 border-r border-gray-200 flex items-center px-4 font-bold text-gray-700 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]"
                                style={{ width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
                            >
                                Fase / Tarea
                            </div>
                            
                            {/* Dates Timeline */}
                            <div className="flex">
                                {datesArray.map((date, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex-shrink-0 border-r border-gray-200/50 flex flex-col justify-center items-center text-xs text-gray-500 ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-100/50' : ''}`}
                                        style={{ width: `${DAY_WIDTH}px` }}
                                    >
                                        <span className="font-bold">{date.getDate()}</span>
                                        <span className="text-[10px] uppercase">{date.toLocaleDateString('es-ES', { month: 'short' })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="relative">
                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 flex pl-[280px] pointer-events-none z-0">
                                    {datesArray.map((date, i) => (
                                    <div 
                                        key={i} 
                                        className={`flex-shrink-0 border-r border-gray-100 h-full ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50/50' : ''}`}
                                        style={{ width: `${DAY_WIDTH}px` }}
                                    />
                                    ))}
                            </div>

                            {groupedTasks.map((group) => (
                                <div key={group.subProject.id}>
                                    {/* Swimlane Header */}
                                    <div className="sticky left-0 z-20 flex bg-white/95 backdrop-blur-sm border-b border-gray-200">
                                        <div 
                                            className="sticky left-0 z-20 flex items-center px-4 py-2 font-bold text-sm text-gray-800 border-r border-gray-200"
                                            style={{ width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px`, backgroundColor: group.subProject.color }}
                                        >
                                            <Layers size={14} className="mr-2 opacity-60"/>
                                            {group.subProject.name}
                                        </div>
                                        <div className="flex-1" style={{ backgroundColor: `${group.subProject.color}40` }}></div>
                                    </div>

                                    {/* Tasks within swimlane */}
                                    {group.tasks.map((task) => {
                                        const startX = getPosition(task.createdAt);
                                        const endX = getPosition(task.dueDate);
                                        const width = Math.max(endX - startX, DAY_WIDTH); 
                                        
                                        const isBlocked = task.blockedBy.length > 0 && state.tasks.some(t => task.blockedBy.includes(t.id) && t.status !== 'done');
                                        
                                        return (
                                            <div key={task.id} className="flex border-b border-gray-100 hover:bg-gray-50/80 transition-colors h-12 relative group z-10">
                                                
                                                {/* Task Name (Sticky Left) */}
                                                <div 
                                                    className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r border-gray-200 flex items-center px-4 pl-8 text-sm font-medium text-gray-600 truncate shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]"
                                                    style={{ width: `${COLUMN_WIDTH}px`, minWidth: `${COLUMN_WIDTH}px` }}
                                                >
                                                    <div className="flex items-center gap-2 truncate w-full" title={task.title}>
                                                        {isBlocked && <Lock size={12} className="text-red-500 flex-shrink-0" />}
                                                        <span className="truncate">{task.title}</span>
                                                    </div>
                                                </div>

                                                {/* Timeline Bar Area */}
                                                <div className="relative flex-1">
                                                        <div 
                                                        onClick={() => openTaskModal(task)}
                                                        className={`
                                                            absolute top-2 h-8 rounded-md shadow-sm border cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all
                                                            flex items-center px-2 overflow-hidden
                                                            ${isBlocked ? 'bg-red-100 border-red-300 pattern-diagonal-lines' : 
                                                                task.status === 'done' ? 'bg-emerald-100 border-emerald-300' :
                                                                task.status === 'doing' ? 'bg-blue-100 border-blue-300' : 'bg-slate-100 border-slate-300'}
                                                        `}
                                                        style={{ 
                                                            left: `${startX}px`, 
                                                            width: `${width}px` 
                                                        }}
                                                        >
                                                            <span className={`text-xs font-semibold whitespace-nowrap truncate ${isBlocked ? 'text-red-700' : 'text-gray-700'}`}>
                                                            {isBlocked && <AlertCircle size={12} className="inline mr-1" />}
                                                            {task.vendorId ? state.vendors.find(v => v.id === task.vendorId)?.name : ''}
                                                            </span>
                                                        </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};