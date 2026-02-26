import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertCircle, TrendingUp, Printer, Database } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { INITIAL_TASKS, INITIAL_TEAM_MEMBERS, INITIAL_SUBPROJECTS } from '../constants';

export const Dashboard = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { state } = context;

    // Calculate Metrics
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter(t => t.status === 'done').length;
    const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalBudget = state.tasks.reduce((sum, t) => sum + (t.budgetEstimated || 0), 0);
    const totalCost = state.tasks.reduce((sum, t) => sum + (t.costReal || 0), 0);
    const variance = totalCost - totalBudget;

    const dataByPhase = [
        { name: 'Obra Civil', budget: 0, cost: 0 },
        { name: 'Operaciones', budget: 0, cost: 0 },
    ];

    state.tasks.forEach(t => {
        const idx = t.type === 'construction' ? 0 : 1;
        dataByPhase[idx].budget += t.budgetEstimated;
        dataByPhase[idx].cost += t.costReal;
    });

    const pieData = [
        { name: 'Pendiente', value: state.tasks.filter(t => t.status === 'todo').length, color: '#EF4444' },
        { name: 'En Curso', value: state.tasks.filter(t => t.status === 'doing').length, color: '#EAB308' },
        { name: 'Hecho', value: state.tasks.filter(t => t.status === 'done').length, color: '#22C55E' },
    ];

    // Top Deviations (Tasks over budget)
    const overBudgetTasks = state.tasks
        .filter(t => (t.costReal - t.budgetEstimated) > 0)
        .sort((a, b) => (b.costReal - b.budgetEstimated) - (a.costReal - a.budgetEstimated))
        .slice(0, 5);

    const handlePrint = () => {
        window.print();
    };

    const handleSeed = async () => {
        try {
            if (!confirm('¿Cargar datos de ejemplo? Esto duplicará los datos si ya existen.')) return;

            // Seed SubProjects
            for (const sp of INITIAL_SUBPROJECTS) {
                const { id, ...data } = sp;
                await addDoc(collection(db, 'sub_projects'), data);
            }

            // Seed Team Members
            for (const tm of INITIAL_TEAM_MEMBERS) {
                const { id, ...data } = tm;
                await addDoc(collection(db, 'team_members'), data);
            }

            // Seed Tasks
            for (const task of INITIAL_TASKS) {
                const { id, ...data } = task;
                await addDoc(collection(db, 'tasks'), data);
            }

            alert('¡Datos de ejemplo cargados con éxito!');
        } catch (error) {
            console.error("Error seeding data:", error);
            alert('Error al cargar datos.');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-8 print:w-full print:max-w-none">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Resumen del Proyecto</h2>
                    <p className="text-gray-500">Métricas financieras y operativas en tiempo real.</p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0 print:hidden">
                    <button onClick={handleSeed} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition border border-blue-200">
                        <Database size={16} /> Cargar Ejemplos
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition border border-gray-200 shadow-sm">
                        <Printer size={16} /> Exportar
                    </button>
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-sm text-gray-500 mr-2">Estado:</span>
                        <span className="font-bold text-green-600">Activo</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:grid-cols-4">
                <KPICard title="Progreso Total" value={`${progress}%`} sub={`${completedTasks}/${totalTasks} tareas`} color="blue" />
                <KPICard title="Presupuesto Est." value={`$${totalBudget.toLocaleString()}`} sub="Total asignado" color="gray" />
                <KPICard title="Coste Real" value={`$${totalCost.toLocaleString()}`} sub="Gasto actual" color={variance > 0 ? "red" : "green"} />
                <KPICard title="Desviación" value={`${variance > 0 ? '+' : ''}$${variance.toLocaleString()}`} sub="Presupuesto vs Coste" color={variance > 0 ? "red" : "green"} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 print:grid-cols-2">
                {/* Budget vs Cost Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border">
                    <h3 className="font-bold text-gray-700 mb-6">Presupuesto vs Coste Real</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataByPhase}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="budget" name="Presupuesto" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cost" name="Coste Real" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Task Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border">
                    <h3 className="font-bold text-gray-700 mb-6">Estado de Tareas</h3>
                    <div className="h-64 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="ml-8 space-y-2">
                            {pieData.map(p => (
                                <div key={p.name} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                                    <span className="text-sm text-gray-600">{p.name}: {p.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Deviations Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        Alertas: Top Desviaciones Presupuestarias
                    </h3>
                    <span className="text-xs text-gray-500">Tareas con mayor sobrecoste</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Tarea</th>
                                <th className="px-6 py-4">Presupuesto</th>
                                <th className="px-6 py-4">Coste Real</th>
                                <th className="px-6 py-4">Desviación</th>
                                <th className="px-6 py-4">Proyección</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {overBudgetTasks.length > 0 ? (
                                overBudgetTasks.map(t => {
                                    const diff = t.costReal - t.budgetEstimated;
                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-800">{t.title}</td>
                                            <td className="px-6 py-4 font-mono text-gray-600">€{t.budgetEstimated.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-mono text-gray-600">€{t.costReal.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-red-600">+{diff.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-mono text-blue-600">
                                                {t.projectedCost ? `€${t.projectedCost.toLocaleString()}` : '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        No hay desviaciones negativas. ¡Excelente gestión!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center text-xs text-gray-400 hidden print:block mt-8">
                SportsCenter Manager - Informe Ejecutivo
            </div>
        </div>
    );
};

const KPICard = ({ title, value, sub, color }: { title: string, value: string, sub: string, color: string }) => {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        red: 'text-red-600',
        gray: 'text-gray-900',
    };
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border">
            <h4 className="text-sm font-medium text-gray-500 uppercase">{title}</h4>
            <div className={`text-2xl font-bold mt-2 ${colorClasses[color]}`}>{value}</div>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
    )
}