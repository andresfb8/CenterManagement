import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Layers, Trash2, Plus, Pencil, Palette } from 'lucide-react';
import { SubProject } from '../types';

export const SubProjectsView = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { state, addSubProject, updateSubProject, deleteSubProject } = context;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#e0f2fe');

    const openCreate = () => {
        setEditingId(null);
        setName('');
        setDescription('');
        setColor('#e0f2fe');
        setIsFormOpen(true);
    };

    const openEdit = (sp: SubProject) => {
        setEditingId(sp.id);
        setName(sp.name);
        setDescription(sp.description || '');
        setColor(sp.color);
        setIsFormOpen(true);
    };

    const handleSave = () => {
        if (!name) return;

        if (editingId) {
            // Update
            const updatedSP: SubProject = {
                id: editingId,
                name,
                description,
                color
            };
            updateSubProject(updatedSP);
        } else {
            // Create
            const newSP: SubProject = {
                id: `sub_${Date.now()}`,
                name,
                description,
                color
            };
            addSubProject(newSP);
        }

        setIsFormOpen(false);
        setName('');
        setDescription('');
        setColor('#e0f2fe');
        setEditingId(null);
    };

    const handleDelete = (sp: SubProject, taskCount: number) => {
        if (taskCount > 0) {
            const confirm = window.confirm(
                `Esta fase tiene ${taskCount} tareas asignadas.\n\nSi la eliminas, estas tareas quedarán "Sin Fase" asignada.\n¿Estás seguro de que deseas continuar?`
            );
            if (!confirm) return;
        } else {
            if (!window.confirm('¿Eliminar esta fase?')) return;
        }
        deleteSubProject(sp.id);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Fases y Subproyectos</h2>
                    <p className="text-gray-500">Estructura tu obra dividiéndola en fases lógicas para el cronograma.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Nueva Fase
                </button>
            </div>

            {/* Form */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-100 mb-6 animate-fade-in">
                    <h3 className="font-bold text-gray-700 mb-4">{editingId ? 'Editar Fase' : 'Nueva Fase'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre de la Fase</label>
                            <input
                                type="text"
                                placeholder="ej. Cimientos, Estructura, Pista Central..."
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                            <input
                                type="text"
                                placeholder="Breve descripción..."
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Color Identificativo</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    className="h-9 w-16 p-0 border border-gray-300 rounded cursor-pointer"
                                    value={color}
                                    onChange={e => setColor(e.target.value)}
                                />
                                <span className="text-xs text-gray-400">Usado en el diagrama de Gantt</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.subProjects.map(sp => {
                    const taskCount = state.tasks.filter(t => t.subProjectId === sp.id).length;
                    return (
                        <div key={sp.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden group">
                            {/* Color Stripe */}
                            <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: sp.color }}></div>

                            <div className="pl-4 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{sp.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{sp.description || 'Sin descripción'}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEdit(sp)}
                                        className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(sp, taskCount)}
                                        className="p-2 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="pl-4 mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                    <Layers size={14} /> Subproyecto
                                </span>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">
                                    {taskCount} Tareas
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {state.subProjects.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                    <Layers size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No hay fases definidas. Crea una para empezar a organizar.</p>
                </div>
            )}
        </div>
    );
};