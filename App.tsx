import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Kanban as KanbanIcon, 
  Users, 
  Plus, 
  Search, 
  Menu, 
  X,
  Camera,
  LogOut,
  AlertTriangle,
  CalendarDays,
  DollarSign,
  Briefcase,
  Layers
} from 'lucide-react';
import { Task, Vendor, Project, AppState, TaskStatus, TeamMember, SubProject } from './types';
import { INITIAL_TASKS, INITIAL_VENDORS, INITIAL_PROJECT, INITIAL_TEAM_MEMBERS, INITIAL_SUBPROJECTS } from './constants';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import { VendorDirectory } from './components/VendorDirectory';
import { TaskModal } from './components/TaskModal';
import { QuickCapture } from './components/QuickCapture';
import { GanttChart } from './components/GanttChart';
import { FinanceView } from './components/FinanceView';
import { TeamView } from './components/TeamView';
import { SubProjectsView } from './components/SubProjectsView';

// --- Context ---
interface AppContextType {
  state: AppState;
  updateTask: (task: Task) => void;
  addTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  // Team Actions
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  // SubProject Actions
  addSubProject: (subProject: SubProject) => void;
  updateSubProject: (subProject: SubProject) => void;
  deleteSubProject: (id: string) => void;
  
  setSearchQuery: (query: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile: boolean;
  openTaskModal: (task?: Task | null) => void;
}

export const AppContext = React.createContext<AppContextType | null>(null);

export default function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('scm_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('scm_team');
    return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
  });

  const [subProjects, setSubProjects] = useState<SubProject[]>(() => {
    const saved = localStorage.getItem('scm_subprojects');
    return saved ? JSON.parse(saved) : INITIAL_SUBPROJECTS;
  });

  const [vendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [project] = useState<Project>(INITIAL_PROJECT);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('gantt'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Global Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('scm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('scm_team', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('scm_subprojects', JSON.stringify(subProjects));
  }, [subProjects]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Actions ---
  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    if (updatedTask.status === 'done' && updatedTask.recurrence) {
        const nextDate = updatedTask.recurrence.frequency === 'daily' ? 86400000 : 604800000;
        const newTask: Task = {
            ...updatedTask,
            id: `task_${Date.now()}`,
            status: 'todo',
            checklist: updatedTask.checklist.map(c => ({ ...c, done: false })),
            createdAt: Date.now(),
            dueDate: Date.now() + nextDate,
            title: `${updatedTask.title} (Recurrente)`,
            costReal: 0 
        };
        setTimeout(() => addTask(newTask), 500); 
    }
  };

  const addTask = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Team Logic
  const addTeamMember = (member: TeamMember) => {
    setTeamMembers(prev => [...prev, member]);
  };

  const updateTeamMember = (member: TeamMember) => {
    setTeamMembers(prev => prev.map(m => m.id === member.id ? member : m));
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
  };

  // SubProject Logic
  const addSubProject = (subProject: SubProject) => {
    setSubProjects(prev => [...prev, subProject]);
  };

  const updateSubProject = (subProject: SubProject) => {
    setSubProjects(prev => prev.map(sp => sp.id === subProject.id ? subProject : sp));
  };

  const deleteSubProject = (id: string) => {
    setSubProjects(prev => prev.filter(sp => sp.id !== id));
    // Clean up tasks that belonged to this subproject
    setTasks(prev => prev.map(t => 
        t.subProjectId === id ? { ...t, subProjectId: '' } : t
    ));
  };

  const openTaskModal = (task: Task | null = null) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  const contextValue: AppContextType = {
    state: { tasks, vendors, teamMembers, subProjects, currentProject: project, searchQuery },
    updateTask,
    addTask,
    deleteTask,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addSubProject,
    updateSubProject,
    deleteSubProject,
    setSearchQuery,
    activeTab,
    setActiveTab,
    isMobile,
    openTaskModal
  };

  // --- Render ---
  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen bg-gray-50 overflow-hidden text-slate-800 font-sans">
        
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl z-20">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-xl font-bold tracking-tight text-blue-400">SportsCenter</h1>
            <p className="text-xs text-slate-400 mt-1">Manager v2.0</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem 
              icon={<LayoutDashboard size={20}/>} 
              label="Resumen" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
             <NavItem 
              icon={<CalendarDays size={20}/>} 
              label="Cronograma" 
              active={activeTab === 'gantt'} 
              onClick={() => setActiveTab('gantt')} 
            />
            <NavItem 
              icon={<KanbanIcon size={20}/>} 
              label="Tablero" 
              active={activeTab === 'kanban'} 
              onClick={() => setActiveTab('kanban')} 
            />
            <NavItem 
              icon={<DollarSign size={20}/>} 
              label="Finanzas" 
              active={activeTab === 'finance'} 
              onClick={() => setActiveTab('finance')} 
            />
            <div className="pt-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Gestión</div>
            <NavItem 
              icon={<Layers size={20}/>} 
              label="Fases (Subproyectos)" 
              active={activeTab === 'subprojects'} 
              onClick={() => setActiveTab('subprojects')} 
            />
            <NavItem 
              icon={<Users size={20}/>} 
              label="Equipo" 
              active={activeTab === 'team'} 
              onClick={() => setActiveTab('team')} 
            />
            <NavItem 
              icon={<Briefcase size={20}/>} 
              label="Proveedores" 
              active={activeTab === 'vendors'} 
              onClick={() => setActiveTab('vendors')} 
            />
          </nav>

          <div className="p-4 border-t border-slate-700">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">PM</div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">Admin Proyecto</p>
                    <p className="text-xs text-slate-400">admin@sc.com</p>
                </div>
                <LogOut size={16} className="text-slate-400 cursor-pointer hover:text-white"/>
             </div>
          </div>
        </aside>

        {/* Mobile Header & Content Wrapper */}
        <div className="flex-1 flex flex-col h-full relative">
          
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 z-10 print:hidden">
            <div className="flex items-center gap-4">
               <button className="md:hidden text-gray-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                 {isMobileMenuOpen ? <X /> : <Menu />}
               </button>
               <h2 className="text-lg font-semibold text-gray-800 truncate">
                 {activeTab === 'dashboard' ? 'Resumen General' : 
                  activeTab === 'gantt' ? 'Cronograma por Subproyecto' :
                  activeTab === 'kanban' ? 'Tablero de Tareas' : 
                  activeTab === 'team' ? 'Equipo y Personal' :
                  activeTab === 'subprojects' ? 'Fases y Subproyectos' :
                  activeTab === 'finance' ? 'Finanzas y Costes' : 'Directorio Proveedores'}
               </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar tareas..." 
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </header>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
             <div className="absolute top-16 left-0 w-full bg-slate-900 text-white z-50 p-4 space-y-4 shadow-lg md:hidden print:hidden">
                <NavItem icon={<LayoutDashboard size={20}/>} label="Resumen" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false)}} />
                <NavItem icon={<CalendarDays size={20}/>} label="Cronograma" active={activeTab === 'gantt'} onClick={() => {setActiveTab('gantt'); setIsMobileMenuOpen(false)}} />
                <NavItem icon={<KanbanIcon size={20}/>} label="Tablero" active={activeTab === 'kanban'} onClick={() => {setActiveTab('kanban'); setIsMobileMenuOpen(false)}} />
                <NavItem icon={<DollarSign size={20}/>} label="Finanzas" active={activeTab === 'finance'} onClick={() => {setActiveTab('finance'); setIsMobileMenuOpen(false)}} />
                <NavItem icon={<Layers size={20}/>} label="Fases" active={activeTab === 'subprojects'} onClick={() => {setActiveTab('subprojects'); setIsMobileMenuOpen(false)}} />
                <NavItem icon={<Users size={20}/>} label="Equipo" active={activeTab === 'team'} onClick={() => {setActiveTab('team'); setIsMobileMenuOpen(false)}} />
                <NavItem icon={<Briefcase size={20}/>} label="Proveedores" active={activeTab === 'vendors'} onClick={() => {setActiveTab('vendors'); setIsMobileMenuOpen(false)}} />
             </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-6 relative">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'gantt' && <GanttChart />}
            {activeTab === 'kanban' && <KanbanBoard />}
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'vendors' && <VendorDirectory />}
            {activeTab === 'team' && <TeamView />}
            {activeTab === 'subprojects' && <SubProjectsView />}
          </main>
          
          {/* FAB for Mobile Quick Capture */}
          <div className="print:hidden">
             <QuickCapture />
          </div>
          
        </div>
      </div>

      {/* Global Task Modal */}
      <TaskModal 
        task={selectedTask} 
        isOpen={isTaskModalOpen} 
        onClose={closeTaskModal} 
      />

    </AppContext.Provider>
  );
}

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);