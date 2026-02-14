import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { Task, TaskStatus, TeamMember } from '../types';
import { 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  Lock,
  HardHat,
  Filter,
  ArrowUpNarrowWide,
  ArrowDownNarrowWide
} from 'lucide-react';

export const KanbanBoard = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { state, openTaskModal } = context;

  // --- Filter & Sort State ---
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterSubProject, setFilterSubProject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // --- Filtering & Sorting Logic ---
  const filteredTasks = useMemo(() => {
    let result = state.tasks.filter(t => 
      t.title.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(state.searchQuery.toLowerCase())
    );

    // Apply Filters
    if (filterAssignee !== 'all') {
        result = result.filter(t => t.assigneeId === filterAssignee);
    }
    if (filterSubProject !== 'all') {
        result = result.filter(t => t.subProjectId === filterSubProject);
    }
    if (filterPriority !== 'all') {
        result = result.filter(t => t.priority === filterPriority);
    }

    // Apply Sort
    return result.sort((a, b) => {
        let valA = a[sortBy] || 0;
        let valB = b[sortBy] || 0;

        // Handle nulls (e.g. no due date) pushing them to end usually
        if (valA === 0) valA = 9999999999999;
        if (valB === 0) valB = 9999999999999;

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });
  }, [state.tasks, state.searchQuery, filterAssignee, filterSubProject, filterPriority, sortBy, sortOrder]);

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'Pendiente', color: 'border-t-4 border-red-500' },
    { id: 'doing', label: 'En Curso', color: 'border-t-4 border-yellow-500' },
    { id: 'done', label: 'Hecho', color: 'border-t-4 border-green-500' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = state.tasks.find(t => t.id === taskId);
    
    if (task && task.status !== status) {
      // Check blocking
      if (status !== 'todo') { 
          const blockedByTasks = state.tasks.filter(t => task.blockedBy.includes(t.id));
          const isBlocked = blockedByTasks.some(t => t.status !== 'done');
          
          if (isBlocked) {
            alert(`No se puede mover. Bloqueada por: ${blockedByTasks.filter(t => t.status !== 'done').map(t => t.title).join(', ')}`);
            return;
          }
      }
      context.updateTask({ ...task, status });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-full">
      
      {/* --- Filter Toolbar --- */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-4 flex flex-wrap gap-4 items-center animate-fade-in">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
            <Filter size={16} /> Filtros:
        </div>

        {/* Assignee Filter */}
        <select 
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
        >
            <option value="all">Todos los Responsables</option>
            {state.teamMembers.map(tm => (
                <option key={tm.id} value={tm.id}>{tm.name}</option>
            ))}
        </select>

        {/* SubProject Filter */}
        <select 
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 max-w-[200px]"
            value={filterSubProject}
            onChange={(e) => setFilterSubProject(e.target.value)}
        >
            <option value="all">Todas las Fases</option>
            {state.subProjects.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
        </select>

        {/* Priority Filter */}
        <select 
            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
        >
            <option value="all">Cualquier Prioridad</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
        </select>

        <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
            <select 
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'createdAt')}
            >
                <option value="dueDate">Vencimiento</option>
                <option value="createdAt">Creación</option>
            </select>
            
            <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 border border-gray-200"
                title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
            >
                {sortOrder === 'asc' ? <ArrowUpNarrowWide size={18}/> : <ArrowDownNarrowWide size={18} />}
            </button>
        </div>

        {/* Results count */}
        <div className="ml-auto text-xs text-gray-400 font-medium hidden md:block">
            Mostrando {filteredTasks.length} tareas
        </div>
      </div>

      {/* --- Board --- */}
      <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-4 flex-1 min-h-0">
        {columns.map(col => (
          <div 
            key={col.id} 
            className="flex-1 min-w-[300px] flex flex-col bg-gray-100 rounded-xl shadow-sm h-full max-h-full"
            onDrop={(e) => handleDrop(e, col.id)}
            onDragOver={handleDragOver}
          >
            <div className={`p-4 bg-white rounded-t-xl shadow-sm ${col.color} flex justify-between items-center flex-shrink-0`}>
              <h3 className="font-bold text-gray-700">{col.label}</h3>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">
                {filteredTasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3 no-scrollbar min-h-0">
              {filteredTasks
                .filter(t => t.status === col.id)
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onClick={() => openTaskModal(task)} 
                    onDragStart={handleDragStart}
                    allTasks={state.tasks}
                    teamMembers={state.teamMembers}
                    subProjectName={state.subProjects.find(sp => sp.id === task.subProjectId)?.name}
                  />
                ))}
                {filteredTasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        Sin tareas
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TaskCardProps {
    task: Task;
    onClick: () => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    allTasks: Task[];
    teamMembers: TeamMember[];
    subProjectName?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
    task, 
    onClick, 
    onDragStart, 
    allTasks,
    teamMembers,
    subProjectName
}) => {
  const isBlocked = useMemo(() => {
    if (task.blockedBy.length === 0) return false;
    const blockers = allTasks.filter(t => task.blockedBy.includes(t.id));
    return blockers.some(t => t.status !== 'done');
  }, [task, allTasks]);

  const overBudget = task.costReal > task.budgetEstimated && task.budgetEstimated > 0;
  const completedChecks = task.checklist.filter(c => c.done).length;
  const totalChecks = task.checklist.length;
  const assignee = teamMembers.find(m => m.id === task.assigneeId);

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
      className={`
        bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative
        ${isBlocked ? 'border-l-4 border-l-red-500 bg-red-50' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2">
         <div className="flex flex-col items-start gap-1 max-w-[70%]">
             <div className="flex items-center gap-1">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${task.type === 'construction' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {task.type === 'construction' ? 'Obra' : 'Mantenimiento'}
                </span>
                {task.priority === 'high' && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">!!!</span>}
             </div>
             {subProjectName ? (
                 <span className="text-[10px] text-gray-400 font-medium truncate w-full" title={subProjectName}>{subProjectName}</span>
             ) : (
                 <span className="text-[10px] text-gray-300 font-medium italic">Sin Fase</span>
             )}
         </div>
         
         <div className="flex items-center gap-2">
            {assignee && (
                <div 
                    className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold"
                    title={`Responsable: ${assignee.name}`}
                >
                    {assignee.initials}
                </div>
            )}
            {isBlocked && <Lock size={14} className="text-red-500" />}
         </div>
      </div>

      <h4 className="font-semibold text-gray-800 text-sm mb-1 leading-tight">{task.title}</h4>
      
      <div className="flex flex-wrap gap-2 mt-3 text-gray-500 text-xs">
        {task.dueDate && (
             <div className={`flex items-center gap-1 ${task.dueDate < Date.now() && task.status !== 'done' ? 'text-red-500 font-bold' : ''}`}>
                 <Calendar size={12} />
                 <span>{new Date(task.dueDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}</span>
             </div>
        )}
        
        {totalChecks > 0 && (
            <div className="flex items-center gap-1">
                <CheckSquare size={12} />
                <span>{completedChecks}/{totalChecks}</span>
            </div>
        )}

        {overBudget && (
            <div className="flex items-center gap-1 text-red-600 font-bold">
                <AlertTriangle size={12} />
                <span>Desvío</span>
            </div>
        )}
        
        {task.vendorId && (
             <div className="flex items-center gap-1 text-orange-600" title="Proveedor asignado">
                <HardHat size={12} />
             </div>
        )}
      </div>
    </div>
  );
};