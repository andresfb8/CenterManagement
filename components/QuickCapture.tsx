import React, { useContext, useRef } from 'react';
import { Plus, Camera } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { Task } from '../types';

export const QuickCapture = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { addTask, openTaskModal, state } = context;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    // Pre-fill task with photo but let user edit
                    const newTaskTemplate: Task = {
                        id: `task_${Date.now()}`,
                        title: '',
                        description: 'Capturada desde móvil.',
                        status: 'todo',
                        subProjectId: state.subProjects[0]?.id || 'general',
                        type: 'construction',
                        priority: 'medium',
                        blockedBy: [],
                        vendorId: '',
                        budgetEstimated: 0,
                        costReal: 0,
                        checklist: [],
                        photos: [reader.result as string],
                        attachments: [],
                        createdAt: Date.now(),
                        dueDate: Date.now() + 86400000,
                    };
                    openTaskModal(newTaskTemplate);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleManualCreate = () => {
        // Open modal with empty task
        const newTask: Task = {
            id: `task_${Date.now()}`,
            title: '',
            description: '',
            status: 'todo',
            subProjectId: state.subProjects[0]?.id || 'general',
            type: 'construction',
            priority: 'medium',
            blockedBy: [],
            vendorId: '',
            budgetEstimated: 0,
            costReal: 0,
            checklist: [],
            photos: [],
            attachments: [],
            createdAt: Date.now(),
            dueDate: Date.now() + 86400000,
        };
        openTaskModal(newTask);
    };

    return (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-40">
            {/* Hidden Input for Camera */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-slate-700 p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition"
                title="Foto Rápida"
            >
                <Camera size={24} />
            </button>

            <button
                onClick={handleManualCreate}
                className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition transform hover:scale-105"
                title="Crear Tarea"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};