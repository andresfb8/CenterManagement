import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../App';
import { Task, ChecklistItem } from '../types';
import { X, Check, Trash2, Camera, Link, DollarSign, Clock, AlertCircle, TrendingUp, FileText, PieChart, Search, Info, Users, HardHat, Layers, AlertTriangle, History } from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskModal = ({ task, isOpen, onClose }: TaskModalProps) => {
  const context = useContext(AppContext);
  if (!context || !task) return null;
  
  const { state, updateTask, deleteTask, addTask } = context;
  const [activeTab, setActiveTab] = useState('detalles');
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [dependencySearch, setDependencySearch] = useState(''); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if we are creating a new task or editing
  const isNew = !state.tasks.find(t => t.id === task.id);

  useEffect(() => {
    if (task) setEditedTask(task);
  }, [task]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (isNew) {
        addTask(editedTask);
    } else {
        updateTask(editedTask);
    }
    onClose();
  };

  const handleDelete = () => {
      if (!isNew) {
          deleteTask(task.id);
      }
      onClose();
  }

  const handleChecklistToggle = (itemId: string) => {
    const updatedChecklist = editedTask.checklist.map(item => 
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    setEditedTask({ ...editedTask, checklist: updatedChecklist });
  };

  const addChecklistItem = (text: string) => {
     if (!text.trim()) return;
     const newItem: ChecklistItem = { id: Date.now().toString(), text, done: false };
     setEditedTask({ ...editedTask, checklist: [...editedTask.checklist, newItem] });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setEditedTask(prev => ({
                    ...prev,
                    photos: [...prev.photos, reader.result as string]
                }));
            }
        };
        reader.readAsDataURL(file);
    }
  };

  // Financial Calculations
  const variance = editedTask.costReal - editedTask.budgetEstimated;
  const variancePercent = editedTask.budgetEstimated > 0 
    ? ((variance / editedTask.budgetEstimated) * 100).toFixed(1) 
    : '0';
  const progressPercent = editedTask.budgetEstimated > 0
    ? Math.min(((editedTask.costReal / editedTask.budgetEstimated) * 100), 100)
    : 0;

  // Resolve and Filter dependencies
  const potentialBlockers = state.tasks
    .filter(t => t.id !== editedTask.id)
    .filter(t => t.title.toLowerCase().includes(dependencySearch.toLowerCase()));

  // Filter history for this task
  const taskHistory = state.history.filter(h => h.taskId === task.id).sort((a, b) => b.timestamp - a.timestamp);

  const tabs = [
      { id: 'detalles', label: 'Detalles' },
      { id: 'checklist', label: 'Checklist' },
      { id: 'fotos', label: 'Fotos' },
      { id: 'finanzas', label: 'Finanzas' },
      { id: 'historial', label: 'Historial' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
           <div className="flex-1">
             <input 
                type="text"
                className="text-xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder-gray-400"
                value={editedTask.title}
                onChange={e => setEditedTask({...editedTask, title: e.target.value})}
                placeholder="Título de la Tarea..."
             />
             <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${editedTask.type === 'construction' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {editedTask.type === 'construction' ? 'Obra' : 'Mantenimiento'}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <select 
                    className="text-xs bg-transparent border-none p-0 text-gray-500 focus:ring-0 font-medium cursor-pointer hover:text-blue-600"
                    value={editedTask.status}
                    onChange={e => setEditedTask({...editedTask, status: e.target.value as any})}
                >
                    <option value="todo">Pendiente</option>
                    <option value="doing">En Curso</option>
                    <option value="done">Completado</option>
                </select>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* --- Tab: Details --- */}
          {activeTab === 'detalles' && (
            <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              
              {/* SubProject / Phase Selector */}
              <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                       <Layers size={16} className="text-purple-500" />
                       Subproyecto / Fase
                   </label>
                   <select 
                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                     value={editedTask.subProjectId || ''}
                     onChange={e => setEditedTask({...editedTask, subProjectId: e.target.value})}
                   >
                     {state.subProjects.map(sp => (
                       <option key={sp.id} value={sp.id}>{sp.name}</option>
                     ))}
                   </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  rows={3}
                  value={editedTask.description}
                  onChange={e => setEditedTask({...editedTask, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Internal Assignee */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                       <Users size={16} className="text-blue-500" />
                       Responsable Interno
                   </label>
                   <select 
                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                     value={editedTask.assigneeId || ''}
                     onChange={e => setEditedTask({...editedTask, assigneeId: e.target.value})}
                   >
                     <option value="">Sin Asignar</option>
                     {state.teamMembers.map(m => (
                       <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                     ))}
                   </select>
                </div>
                
                {/* External Vendor */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                       <HardHat size={16} className="text-orange-500" />
                       Proveedor / Contrata
                   </label>
                   <select 
                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                     value={editedTask.vendorId || ''}
                     onChange={e => setEditedTask({...editedTask, vendorId: e.target.value})}
                   >
                     <option value="">Sin Asignar</option>
                     {state.vendors.map(v => (
                       <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                     ))}
                   </select>
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Clock size={16} className="text-gray-500" />
                      Fecha Vencimiento
                   </label>
                   <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      value={new Date(editedTask.dueDate).toISOString().split('T')[0]}
                      onChange={(e) => setEditedTask({...editedTask, dueDate: new Date(e.target.value).getTime()})}
                   />
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                       <AlertTriangle size={16} className={editedTask.priority === 'high' ? 'text-red-500' : editedTask.priority === 'medium' ? 'text-orange-500' : 'text-blue-500'} />
                       Prioridad
                   </label>
                   <select 
                     className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                     value={editedTask.priority}
                     onChange={e => setEditedTask({...editedTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                   >
                     <option value="low">Baja</option>
                     <option value="medium">Media</option>
                     <option value="high">Alta</option>
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bloqueado Por (Dependencias)</label>
                <p className="text-xs text-gray-500 mb-2">
                    Tareas que deben finalizar antes de iniciar esta (marcar casillas).
                </p>
                
                {/* Search Input for Dependencies */}
                <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Buscar tarea para vincular..." 
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                        value={dependencySearch}
                        onChange={(e) => setDependencySearch(e.target.value)}
                    />
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                    {potentialBlockers.length > 0 ? potentialBlockers.map(t => (
                        <div key={t.id} className="flex items-center gap-2 py-1 hover:bg-gray-100 rounded px-1 transition-colors">
                            <input 
                                type="checkbox" 
                                id={`block-${t.id}`}
                                checked={editedTask.blockedBy.includes(t.id)}
                                onChange={(e) => {
                                    const newBlockedBy = e.target.checked 
                                        ? [...editedTask.blockedBy, t.id]
                                        : editedTask.blockedBy.filter(id => id !== t.id);
                                    setEditedTask({...editedTask, blockedBy: newBlockedBy});
                                }}
                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor={`block-${t.id}`} className="text-sm text-gray-700 truncate cursor-pointer select-none flex-1">
                                {t.title} 
                            </label>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${t.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {t.status === 'done' ? 'Hecho' : 'Pendiente'}
                            </span>
                        </div>
                    )) : (
                        <p className="text-xs text-gray-400 text-center py-2">No se encontraron tareas.</p>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* --- Tab: Checklist --- */}
          {activeTab === 'checklist' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <div className="mb-4 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Añadir sub-tarea..." 
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            addChecklistItem((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                        }
                    }}
                  />
                  <button className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">Añadir</button>
               </div>
               <ul className="space-y-2">
                 {editedTask.checklist.map(item => (
                   <li key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div 
                        onClick={() => handleChecklistToggle(item.id)}
                        className={`w-5 h-5 rounded border cursor-pointer flex items-center justify-center transition-colors ${item.done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300'}`}
                      >
                         {item.done && <Check size={14} />}
                      </div>
                      <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.text}</span>
                      <button 
                        onClick={() => setEditedTask({...editedTask, checklist: editedTask.checklist.filter(i => i.id !== item.id)})}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16}/>
                      </button>
                   </li>
                 ))}
                 {editedTask.checklist.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Sin elementos en el checklist.</p>}
               </ul>
            </div>
          )}

          {/* --- Tab: Photos --- */}
          {activeTab === 'fotos' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition mb-6"
                >
                    <Camera className="mb-2" />
                    <span className="text-sm font-medium">Subir Foto</span>
                </button>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {editedTask.photos.map((photo, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group">
                            <img src={photo} alt="Task attachment" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <button 
                                    onClick={() => setEditedTask({...editedTask, photos: editedTask.photos.filter((_, i) => i !== idx)})}
                                    className="p-2 bg-red-500 rounded-full text-white"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* --- Tab: Finance --- */}
          {activeTab === 'finanzas' && (
            <div className="space-y-6">
               
               {/* Analysis Card */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <PieChart size={20} className="text-blue-500"/>
                          Análisis de Rentabilidad
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${variance > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {variance > 0 ? 'Sobre Coste' : 'Bajo Presupuesto'}
                      </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="mb-6">
                      <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                          <span>Consumo del Presupuesto</span>
                          <span>{progressPercent.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                             className={`h-full rounded-full transition-all duration-500 ${variance > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                             style={{ width: `${progressPercent}%` }}
                          ></div>
                      </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Desviación ($)</p>
                          <p className={`text-lg font-mono font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                          </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Desviación (%)</p>
                          <p className={`text-lg font-mono font-bold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {variancePercent}%
                          </p>
                      </div>
                  </div>
               </div>

               {/* Editing Form */}
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                      <DollarSign size={16} /> Datos Económicos
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Presupuesto Estimado</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                                value={editedTask.budgetEstimated}
                                onChange={e => setEditedTask({...editedTask, budgetEstimated: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Coste Real (Facturado)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input 
                                type="number" 
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg font-mono text-sm ${editedTask.costReal > editedTask.budgetEstimated ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-300'}`}
                                value={editedTask.costReal}
                                onChange={e => setEditedTask({...editedTask, costReal: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                      </div>
                      <div className="relative group">
                          <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1 cursor-help">
                              Proyección Final <Info size={12} className="text-blue-500" />
                          </label>
                          {/* Tooltip for user explanation */}
                          <div className="absolute hidden group-hover:block bottom-full left-0 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg z-10 mb-1">
                              Estimación total del coste al finalizar la tarea (lo gastado + lo que falta).
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg font-mono text-sm bg-blue-50"
                                placeholder="Est. final"
                                value={editedTask.projectedCost || ''}
                                onChange={e => setEditedTask({...editedTask, projectedCost: parseFloat(e.target.value) || 0})}
                            />
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                           <FileText size={14} /> Notas Financieras / Auditoría
                      </label>
                      <textarea 
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          rows={3}
                          placeholder="Justificación de desvíos, números de factura, observaciones..."
                          value={editedTask.financialNotes || ''}
                          onChange={e => setEditedTask({...editedTask, financialNotes: e.target.value})}
                      />
                  </div>
               </div>

            </div>
          )}

          {/* --- Tab: History --- */}
          {activeTab === 'historial' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                    <History size={16} /> Registro de Actividad
                </h3>
                {taskHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm italic">
                        No hay movimientos registrados aún.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {taskHistory.map(entry => (
                            <div key={entry.id} className="flex gap-4 items-start relative">
                                {/* Timeline Line */}
                                <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gray-200 -z-10 last:hidden"></div>
                                
                                <div className="w-20 text-right flex-shrink-0">
                                    <div className="text-xs font-bold text-gray-700">{new Date(entry.timestamp).toLocaleDateString()}</div>
                                    <div className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm mt-1 flex-shrink-0"></div>
                                <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700">
                                    {entry.description}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center">
             <button 
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
             >
                 <Trash2 size={16} /> {isNew ? 'Descartar' : 'Eliminar'}
             </button>
             <div className="flex gap-3">
                 <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium">Cancelar</button>
                 <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition">{isNew ? 'Crear Tarea' : 'Guardar Cambios'}</button>
             </div>
        </div>

      </div>
    </div>
  );
};