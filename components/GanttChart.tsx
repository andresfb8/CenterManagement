import React, { useContext, useMemo, useState, useRef, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Lock, AlertCircle, Calendar, Layers, CheckSquare, X, Settings2 } from 'lucide-react';

export const GanttChart = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { state, openTaskModal, isMobile } = context;

    // --- State ---
    const [hiddenPhases, setHiddenPhases] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');
    const [dateFilter, setDateFilter] = useState<{ start: number | null, end: number | null }>({ start: null, end: null });
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // --- Refs ---
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const filterRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Measure container size
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Close filter dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Filter Logic ---
    const togglePhase = (id: string) => {
        const next = new Set(hiddenPhases);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setHiddenPhases(next);
    };

    const toggleAll = () => {
        if (hiddenPhases.size > 0) {
            setHiddenPhases(new Set());
        } else {
            const allIds = state.subProjects.map(sp => sp.id).concat(['other']);
            setHiddenPhases(new Set(allIds));
        }
    };

    // --- Filtered Tasks ---
    const filteredTasks = useMemo(() => {
        return state.tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(state.searchQuery.toLowerCase());
            const phaseId = t.subProjectId || 'other';
            if (hiddenPhases.has(phaseId)) return false;
            if (!t.subProjectId && hiddenPhases.has('other')) return false;
            return matchesSearch;
        }).sort((a, b) => {
            const startA = a.startDate || a.createdAt;
            const startB = b.startDate || b.createdAt;
            return startA - startB;
        });
    }, [state.tasks, state.searchQuery, hiddenPhases]);

    // --- Timeline Calculations ---
    const { minDate, totalDays } = useMemo(() => {
        const now = Date.now();
        let startCalc: number;
        let endCalc: number;

        if (dateFilter.start && dateFilter.end) {
            startCalc = dateFilter.start;
            endCalc = dateFilter.end;
        } else {
            const timestamps = filteredTasks.flatMap(t => [t.startDate || t.createdAt, t.dueDate]);
            timestamps.push(now);
            const min = Math.min(...timestamps);
            const max = Math.max(...timestamps);
            startCalc = min - (7 * 86400000);
            const futureHorizon = now + (180 * 86400000); // 6 meses
            const taskHorizon = max + (30 * 86400000);
            endCalc = Math.max(futureHorizon, taskHorizon);
        }

        return {
            minDate: startCalc,
            totalDays: Math.ceil((endCalc - startCalc) / 86400000)
        };
    }, [filteredTasks, dateFilter]);

    // --- Dimensions ---
    const COLUMN_WIDTH = isMobile ? 120 : 200;
    const TOOLBAR_HEIGHT = 56;
    const DAY_WIDTH = useMemo(() => {
        switch (viewMode) {
            case 'day': return isMobile ? 30 : 40;
            case 'week': return isMobile ? 8 : 12;
            case 'month': return isMobile ? 2 : 3;
            case 'quarter': return 1;
            case 'year': return 0.3;
            default: return 12;
        }
    }, [viewMode, isMobile]);

    const TIMELINE_WIDTH = totalDays * DAY_WIDTH;
    const CONTENT_WIDTH = COLUMN_WIDTH + TIMELINE_WIDTH;
    const SCROLL_HEIGHT = containerSize.height - TOOLBAR_HEIGHT - 32; // 32 for padding

    // --- Helpers ---
    const getPosition = (ts: number) => {
        const daysFromStart = (ts - minDate) / 86400000;
        return daysFromStart * DAY_WIDTH;
    };

    const getWeekNumber = (d: Date) => {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const scrollToToday = () => {
        if (!scrollContainerRef.current) return;
        const now = Date.now();
        const daysDiff = (now - minDate) / 86400000;
        const pixelOffset = daysDiff * DAY_WIDTH + COLUMN_WIDTH;
        const containerWidth = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft = Math.max(0, pixelOffset - containerWidth / 2);
    };

    // --- Timeline Headers ---
    const timelineHeaders = useMemo(() => {
        const chunks: { key: string, label: string, days: number }[] = [];
        let currentKey = '';

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(minDate + i * 86400000);
            let key = '';
            let label = '';

            if (viewMode === 'day') {
                key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                const dayNum = date.getDate();
                const monthShort = date.toLocaleDateString('es-ES', { month: 'short' }).slice(0, 3);
                label = `${dayNum}${monthShort}`;
            } else if (viewMode === 'week') {
                const wn = getWeekNumber(date);
                key = `${date.getFullYear()}-W${wn}`;
                label = `S${wn}`;
            } else if (viewMode === 'month') {
                key = `${date.getFullYear()}-${date.getMonth()}`;
                label = date.toLocaleDateString('es-ES', { month: 'short' }).slice(0, 3);
            } else if (viewMode === 'quarter') {
                const q = Math.floor(date.getMonth() / 3) + 1;
                key = `${date.getFullYear()}-Q${q}`;
                label = `T${q}`;
            } else if (viewMode === 'year') {
                key = `${date.getFullYear()}`;
                label = `${date.getFullYear()}`;
            }

            if (key !== currentKey) {
                chunks.push({ key, label, days: 1 });
                currentKey = key;
            } else {
                chunks[chunks.length - 1].days++;
            }
        }
        return chunks;
    }, [minDate, totalDays, viewMode]);

    // --- Grouped Tasks ---
    const groupedTasks = useMemo(() => {
        const groups = state.subProjects.map(sp => ({
            subProject: sp,
            tasks: filteredTasks.filter(t => t.subProjectId === sp.id)
        })).filter(g => g.tasks.length > 0);

        const orphanTasks = filteredTasks.filter(t => !state.subProjects.find(sp => sp.id === t.subProjectId));
        if (orphanTasks.length > 0) {
            groups.push({
                subProject: { id: 'other', name: 'Sin Clasificar', description: '', color: '#e5e7eb' },
                tasks: orphanTasks
            });
        }
        return groups;
    }, [state.subProjects, filteredTasks]);

    // --- Render ---
    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f9fafb',
                padding: '12px'
            }}
        >
            {/* Toolbar */}
            <div
                style={{
                    height: `${TOOLBAR_HEIGHT}px`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginBottom: '8px',
                    flexWrap: 'wrap'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Today Button */}
                    <button
                        onClick={scrollToToday}
                        style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Hoy
                    </button>

                    {/* Zoom Controls */}
                    <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        {(['day', 'week', 'month'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={{
                                    padding: '6px 10px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    border: 'none',
                                    backgroundColor: viewMode === mode ? '#eff6ff' : 'transparent',
                                    color: viewMode === mode ? '#2563eb' : '#6b7280',
                                    cursor: 'pointer'
                                }}
                            >
                                {mode === 'day' ? 'Día' : mode === 'week' ? 'Sem' : 'Mes'}
                            </button>
                        ))}
                    </div>

                    {/* Filter Button */}
                    <div style={{ position: 'relative' }} ref={filterRef}>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 500,
                                borderRadius: '6px',
                                backgroundColor: isFilterOpen ? '#dbeafe' : 'white',
                                color: isFilterOpen ? '#1d4ed8' : '#4b5563',
                                border: '1px solid #e5e7eb',
                                cursor: 'pointer'
                            }}
                        >
                            <Settings2 size={14} />
                            Filtros
                        </button>

                        {isFilterOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '8px',
                                width: '280px',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                border: '1px solid #e5e7eb',
                                zIndex: 100,
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '12px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Fases</span>
                                    <button onClick={toggleAll} style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {hiddenPhases.size > 0 ? 'Mostrar Todas' : 'Ocultar Todas'}
                                    </button>
                                </div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '8px' }}>
                                    {state.subProjects.map(sp => (
                                        <button
                                            key={sp.id}
                                            onClick={() => togglePhase(sp.id)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px',
                                                border: 'none',
                                                background: 'none',
                                                cursor: 'pointer',
                                                borderRadius: '6px',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                border: '2px solid',
                                                borderColor: hiddenPhases.has(sp.id) ? '#d1d5db' : '#2563eb',
                                                backgroundColor: hiddenPhases.has(sp.id) ? 'white' : '#2563eb',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {!hiddenPhases.has(sp.id) && <CheckSquare size={10} color="white" />}
                                            </div>
                                            <span style={{ flex: 1, fontSize: '12px', color: hiddenPhases.has(sp.id) ? '#9ca3af' : '#374151' }}>{sp.name}</span>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: sp.color }}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {filteredTasks.length} tareas
                </div>
            </div>

            {/* Scroll Container - THE KEY FIX */}
            {filteredTasks.length === 0 ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '2px dashed #e5e7eb',
                    color: '#9ca3af'
                }}>
                    <Layers size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p>No hay tareas visibles.</p>
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    style={{
                        flex: 1,
                        overflow: 'scroll', // Force both scrollbars
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        WebkitOverflowScrolling: 'touch',
                        position: 'relative'
                    }}
                >
                    {/* Inner content with fixed width */}
                    <div style={{
                        width: `${CONTENT_WIDTH}px`,
                        minWidth: `${CONTENT_WIDTH}px`,
                        position: 'relative'
                    }}>
                        {/* Header Row - Sticky */}
                        <div style={{
                            display: 'flex',
                            position: 'sticky',
                            top: 0,
                            zIndex: 30,
                            backgroundColor: '#f9fafb',
                            borderBottom: '1px solid #e5e7eb',
                            height: '40px'
                        }}>
                            <div style={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 40,
                                width: `${COLUMN_WIDTH}px`,
                                minWidth: `${COLUMN_WIDTH}px`,
                                backgroundColor: '#f9fafb',
                                borderRight: '1px solid #e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '12px',
                                fontWeight: 600,
                                fontSize: '12px',
                                color: '#374151'
                            }}>
                                Tarea
                            </div>
                            <div style={{ display: 'flex' }}>
                                {timelineHeaders.map(chunk => (
                                    <div
                                        key={chunk.key}
                                        style={{
                                            width: `${chunk.days * DAY_WIDTH}px`,
                                            minWidth: `${chunk.days * DAY_WIDTH}px`,
                                            borderRight: '1px solid #e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '11px',
                                            color: '#6b7280',
                                            backgroundColor: '#f9fafb'
                                        }}
                                    >
                                        {chunk.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        {groupedTasks.map((group) => (
                            <div key={group.subProject.id}>
                                {/* Phase Header */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                                    <div style={{
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 20,
                                        width: `${COLUMN_WIDTH}px`,
                                        minWidth: `${COLUMN_WIDTH}px`,
                                        backgroundColor: group.subProject.color,
                                        borderRight: '1px solid #e5e7eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 12px',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        color: '#1f2937'
                                    }}>
                                        <Layers size={12} style={{ opacity: 0.6 }} />
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {group.subProject.name}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, backgroundColor: `${group.subProject.color}40`, minHeight: '32px' }}></div>
                                </div>

                                {/* Tasks */}
                                {group.tasks.map((task) => {
                                    const taskStart = task.startDate || task.createdAt;
                                    const startX = getPosition(taskStart);
                                    const endX = getPosition(task.dueDate);
                                    const width = Math.max(endX - startX, DAY_WIDTH * 2);
                                    const isBlocked = task.blockedBy.length > 0 && state.tasks.some(t => task.blockedBy.includes(t.id) && t.status !== 'done');

                                    const barColor = isBlocked ? '#fecaca' :
                                        task.status === 'done' ? '#d1fae5' :
                                        task.status === 'doing' ? '#dbeafe' : '#f1f5f9';
                                    const barBorder = isBlocked ? '#fca5a5' :
                                        task.status === 'done' ? '#6ee7b7' :
                                        task.status === 'doing' ? '#93c5fd' : '#cbd5e1';

                                    return (
                                        <div
                                            key={task.id}
                                            style={{
                                                display: 'flex',
                                                borderBottom: '1px solid #f3f4f6',
                                                height: '40px',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 10,
                                                width: `${COLUMN_WIDTH}px`,
                                                minWidth: `${COLUMN_WIDTH}px`,
                                                backgroundColor: 'white',
                                                borderRight: '1px solid #e5e7eb',
                                                display: 'flex',
                                                alignItems: 'center',
                                                paddingLeft: '20px',
                                                paddingRight: '8px',
                                                fontSize: '12px',
                                                color: '#4b5563'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }} title={task.title}>
                                                    {isBlocked && <Lock size={10} color="#ef4444" style={{ flexShrink: 0 }} />}
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                                                </div>
                                            </div>

                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <div
                                                    onClick={() => openTaskModal(task)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '6px',
                                                        left: `${startX}px`,
                                                        width: `${width}px`,
                                                        height: '28px',
                                                        backgroundColor: barColor,
                                                        border: `1px solid ${barBorder}`,
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        paddingLeft: '6px',
                                                        paddingRight: '6px',
                                                        overflow: 'hidden',
                                                        transition: 'transform 0.1s, box-shadow 0.1s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.02)';
                                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 500,
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        color: isBlocked ? '#b91c1c' : '#374151'
                                                    }}>
                                                        {isBlocked && <AlertCircle size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                                                        {task.vendorId ? state.vendors.find(v => v.id === task.vendorId)?.name : task.title}
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
            )}
        </div>
    );
};
