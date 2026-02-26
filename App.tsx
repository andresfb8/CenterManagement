import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Kanban as KanbanIcon,
  Users,
  Search,
  Menu,
  X,
  LogOut,
  CalendarDays,
  DollarSign,
  Briefcase,
  Layers,
  Loader2
} from 'lucide-react';
import { Task, Vendor, Project, AppState, TeamMember, SubProject, HistoryEntry } from './types';
import { INITIAL_VENDORS, INITIAL_PROJECT } from './constants';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import { VendorDirectory } from './components/VendorDirectory';
import { TaskModal } from './components/TaskModal';
import { QuickCapture } from './components/QuickCapture';
import { GanttChart } from './components/GanttChart';
import { FinanceView } from './components/FinanceView';
import { TeamView } from './components/TeamView';
import { SubProjectsView } from './components/SubProjectsView';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';

// --- Context ---
import { AppContext, AppContextType } from './contexts/AppContext';

// --- Context ---
// Moved to contexts/AppContext.tsx

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [subProjects, setSubProjects] = useState<SubProject[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Static/Local for now, or TODO: Move to Firestore
  const [vendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [project] = useState<Project>(INITIAL_PROJECT);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('gantt');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // --- Firestore Listeners ---
  useEffect(() => {
    if (!user) return;

    // Tasks
    const qTasks = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(fetchedTasks);
    });

    // Team Members
    const unsubTeam = onSnapshot(collection(db, 'team_members'), (snapshot) => {
      const fetchedTeam = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TeamMember[];
      setTeamMembers(fetchedTeam);
    });

    // SubProjects
    const unsubSubProjects = onSnapshot(collection(db, 'sub_projects'), (snapshot) => {
      const fetchedSub = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SubProject[];
      setSubProjects(fetchedSub);
    });

    // History
    // Order by timestamp desc
    const qHistory = query(collection(db, 'history'), orderBy('timestamp', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const fetchedHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HistoryEntry[];
      setHistory(fetchedHistory);
    });

    return () => {
      unsubTasks();
      unsubTeam();
      unsubSubProjects();
      unsubHistory();
    };
  }, [user]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Actions ---

  const addHistoryEntry = async (taskId: string, description: string) => {
    try {
      await addDoc(collection(db, 'history'), {
        taskId,
        description,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error adding history:", error);
    }
  };

  const updateTask = async (updatedTask: Task) => {
    try {
      // 1. Update in Firestore
      // Exclude 'id' from the data payload as it's the doc ID
      const { id, ...taskData } = updatedTask;
      await updateDoc(doc(db, 'tasks', id), taskData);

      // 2. History Logging (Check previous state from tasks array)
      const oldTask = tasks.find(t => t.id === id);
      if (oldTask) {
        if (oldTask.status !== updatedTask.status) {
          const statusMap: Record<string, string> = { todo: 'Pendiente', doing: 'En Curso', done: 'Hecho' };
          addHistoryEntry(id, `Estado cambiado a: ${statusMap[updatedTask.status]}`);
        }
        if (oldTask.priority !== updatedTask.priority) {
          const prioMap: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta' };
          addHistoryEntry(id, `Prioridad cambiada a: ${prioMap[updatedTask.priority]}`);
        }
        if (oldTask.assigneeId !== updatedTask.assigneeId) {
          const member = teamMembers.find(m => m.id === updatedTask.assigneeId);
          addHistoryEntry(id, `Reasignado a: ${member ? member.name : 'Sin Asignar'}`);
        }
      }

      // 3. Recurrence Logic
      if (updatedTask.status === 'done' && updatedTask.recurrence) {
        const nextDate = updatedTask.recurrence.frequency === 'daily' ? 86400000 : 604800000;
        const newTaskData = {
          ...taskData,
          status: 'todo',
          checklist: updatedTask.checklist.map(c => ({ ...c, done: false })),
          createdAt: Date.now(),
          dueDate: Date.now() + nextDate,
          title: `${updatedTask.title} (Recurrente)`,
          costReal: 0
        };
        // Add as a new doc
        setTimeout(() => {
          addDoc(collection(db, 'tasks'), newTaskData)
            .then(ref => addHistoryEntry(ref.id, "Tarea recurrente creada automáticamente"));
        }, 500);
      }

    } catch (e) {
      console.error("Error updating task:", e);
    }
  };

  const addTask = async (newTask: Task) => {
    try {
      const { id, ...taskData } = newTask; // Firestore generates ID, or we ignore the temp one
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      addHistoryEntry(docRef.id, "Tarea creada");
    } catch (e) {
      console.error("Error adding task:", e);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  // Team Logic
  const addTeamMember = async (member: TeamMember) => {
    const { id, ...data } = member;
    await addDoc(collection(db, 'team_members'), data);
  };

  const updateTeamMember = async (member: TeamMember) => {
    const { id, ...data } = member;
    await updateDoc(doc(db, 'team_members', id), data);
  };

  const deleteTeamMember = async (id: string) => {
    await deleteDoc(doc(db, 'team_members', id));
  };

  // SubProject Logic
  const addSubProject = async (subProject: SubProject) => {
    const { id, ...data } = subProject;
    await addDoc(collection(db, 'sub_projects'), data);
  };

  const updateSubProject = async (subProject: SubProject) => {
    const { id, ...data } = subProject;
    await updateDoc(doc(db, 'sub_projects', id), data);
  };

  const deleteSubProject = async (id: string) => {
    await deleteDoc(doc(db, 'sub_projects', id));
    // Optional: Clean up tasks that belonged to this subproject
    // This would require a batch update or separate updates for all tasks with this subProjectId
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
    state: { tasks, vendors, teamMembers, subProjects, currentProject: project, searchQuery, history },
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
    openTaskModal,
    addHistoryEntry
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

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
              icon={<LayoutDashboard size={20} />}
              label="Resumen"
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            />
            <NavItem
              icon={<CalendarDays size={20} />}
              label="Cronograma"
              active={activeTab === 'gantt'}
              onClick={() => setActiveTab('gantt')}
            />
            <NavItem
              icon={<KanbanIcon size={20} />}
              label="Tablero"
              active={activeTab === 'kanban'}
              onClick={() => setActiveTab('kanban')}
            />
            <NavItem
              icon={<DollarSign size={20} />}
              label="Finanzas"
              active={activeTab === 'finance'}
              onClick={() => setActiveTab('finance')}
            />
            <div className="pt-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Gestión</div>
            <NavItem
              icon={<Layers size={20} />}
              label="Fases (Subproyectos)"
              active={activeTab === 'subprojects'}
              onClick={() => setActiveTab('subprojects')}
            />
            <NavItem
              icon={<Users size={20} />}
              label="Equipo"
              active={activeTab === 'team'}
              onClick={() => setActiveTab('team')}
            />
            <NavItem
              icon={<Briefcase size={20} />}
              label="Proveedores"
              active={activeTab === 'vendors'}
              onClick={() => setActiveTab('vendors')}
            />
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">Admin</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
              <button onClick={logout}>
                <LogOut size={16} className="text-slate-400 cursor-pointer hover:text-white" />
              </button>
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
              <NavItem icon={<LayoutDashboard size={20} />} label="Resumen" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false) }} />
              <NavItem icon={<CalendarDays size={20} />} label="Cronograma" active={activeTab === 'gantt'} onClick={() => { setActiveTab('gantt'); setIsMobileMenuOpen(false) }} />
              <NavItem icon={<KanbanIcon size={20} />} label="Tablero" active={activeTab === 'kanban'} onClick={() => { setActiveTab('kanban'); setIsMobileMenuOpen(false) }} />
              <NavItem icon={<DollarSign size={20} />} label="Finanzas" active={activeTab === 'finance'} onClick={() => { setActiveTab('finance'); setIsMobileMenuOpen(false) }} />
              <NavItem icon={<Layers size={20} />} label="Fases" active={activeTab === 'subprojects'} onClick={() => { setActiveTab('subprojects'); setIsMobileMenuOpen(false) }} />
              <NavItem icon={<Users size={20} />} label="Equipo" active={activeTab === 'team'} onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false) }} />
              <NavItem icon={<Briefcase size={20} />} label="Proveedores" active={activeTab === 'vendors'} onClick={() => { setActiveTab('vendors'); setIsMobileMenuOpen(false) }} />
              <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-400">
                <LogOut size={20} /> Cerrar Sesión
              </button>
            </div>
          )}

          {/* Main Content Area */}
          <main className={`flex-1 relative transition-all ${activeTab === 'gantt' ? 'h-[calc(100vh-64px)]' : 'p-4 md:p-6 overflow-auto bg-gray-50'}`}>
            <div className={activeTab === 'gantt' ? 'h-full w-full relative bg-gray-50' : ''}>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'gantt' && <GanttChart />}
              {activeTab === 'kanban' && <KanbanBoard />}
              {activeTab === 'finance' && <FinanceView />}
              {activeTab === 'vendors' && <VendorDirectory />}
              {activeTab === 'team' && <TeamView />}
              {activeTab === 'subprojects' && <SubProjectsView />}
            </div>
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