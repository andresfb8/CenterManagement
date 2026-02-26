import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Users, Trash2, Plus, UserPlus, Pencil } from 'lucide-react';
import { TeamMember } from '../types';

export const TeamView = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { state, addTeamMember, updateTeamMember, deleteTeamMember } = context;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [initials, setInitials] = useState('');

    const openCreate = () => {
        setEditingId(null);
        setName('');
        setRole('');
        setInitials('');
        setIsFormOpen(true);
    };

    const openEdit = (member: TeamMember) => {
        setEditingId(member.id);
        setName(member.name);
        setRole(member.role);
        setInitials(member.initials);
        setIsFormOpen(true);
    };

    const handleSave = () => {
        if (!name || !role) return;

        if (editingId) {
            // Update
            const updatedMember: TeamMember = {
                id: editingId,
                name,
                role,
                initials: initials || name.substring(0, 2).toUpperCase()
            };
            updateTeamMember(updatedMember);
        } else {
            // Create
            const member: TeamMember = {
                id: `tm_${Date.now()}`,
                name,
                role,
                initials: initials || name.substring(0, 2).toUpperCase()
            };
            addTeamMember(member);
        }

        setIsFormOpen(false);
        setName('');
        setRole('');
        setInitials('');
        setEditingId(null);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Equipo y Personal</h2>
                    <p className="text-gray-500">Gestiona quién tiene acceso y asignaciones en el proyecto.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <UserPlus size={18} /> Añadir Miembro
                </button>
            </div>

            {/* Form */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 mb-6 animate-fade-in">
                    <h3 className="font-bold text-gray-700 mb-4">{editingId ? 'Editar Miembro' : 'Nuevo Integrante'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Rol (Cargo)</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Iniciales</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                                maxLength={2}
                                value={initials}
                                onChange={e => setInitials(e.target.value.toUpperCase())}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Personal</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Rol</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tareas Asignadas</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {state.teamMembers.map(member => {
                            const taskCount = state.tasks.filter(t => t.assigneeId === member.id).length;
                            return (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                            {member.initials}
                                        </div>
                                        <span className="font-medium text-gray-800">{member.name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium border border-blue-100">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {taskCount} tareas
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => openEdit(member)}
                                            className="text-gray-400 hover:text-blue-500 p-2 rounded-full hover:bg-blue-50 transition"
                                            title="Editar"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteTeamMember(member.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {state.teamMembers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-400">No hay miembros en el equipo.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};