import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Printer, TrendingUp, DollarSign, AlertTriangle, Layers, ArrowRight, Briefcase } from 'lucide-react';

export const FinanceView = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { state } = context;

    // --- Global Calculations ---
    const totalBudget = state.tasks.reduce((sum, t) => sum + (t.budgetEstimated || 0), 0);
    const totalReal = state.tasks.reduce((sum, t) => sum + (t.costReal || 0), 0);
    const totalProjected = state.tasks.reduce((sum, t) => sum + (t.projectedCost || t.costReal || 0), 0);

    // --- Phase / SubProject Calculations ---
    const phaseMetrics = state.subProjects.map(sp => {
        const phaseTasks = state.tasks.filter(t => t.subProjectId === sp.id);
        const budget = phaseTasks.reduce((acc, t) => acc + (t.budgetEstimated || 0), 0);
        const cost = phaseTasks.reduce((acc, t) => acc + (t.costReal || 0), 0);
        const projected = phaseTasks.reduce((acc, t) => acc + (t.projectedCost || t.costReal || 0), 0);

        return {
            ...sp,
            budget,
            cost,
            projected,
            variance: cost - budget,
            percentUsed: budget > 0 ? (cost / budget) * 100 : 0,
            taskCount: phaseTasks.length
        };
    }).filter(p => p.budget > 0 || p.cost > 0); // Only show active phases financially

    // --- Vendor Calculations ---
    const vendorMetrics = state.vendors.map(v => {
        const vendorTasks = state.tasks.filter(t => t.vendorId === v.id);
        const budget = vendorTasks.reduce((acc, t) => acc + (t.budgetEstimated || 0), 0);
        const cost = vendorTasks.reduce((acc, t) => acc + (t.costReal || 0), 0);
        return {
            ...v,
            budget,
            cost,
            variance: cost - budget,
            percentUsed: budget > 0 ? (cost / budget) * 100 : 0,
            taskCount: vendorTasks.length
        };
    }).filter(v => v.budget > 0 || v.cost > 0).sort((a, b) => b.cost - a.cost);

    // --- Task List Sort ---
    // Sort by variance descending (biggest problems first)
    const sortedTasks = [...state.tasks].sort((a, b) => {
        const varA = (a.costReal || 0) - (a.budgetEstimated || 0);
        const varB = (b.costReal || 0) - (b.budgetEstimated || 0);
        return varB - varA;
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto pb-8 print:w-full print:max-w-none">

            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Control Financiero</h2>
                    <p className="text-gray-500 print:hidden">Auditoría de costes, desviaciones y proyecciones.</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition print:hidden"
                >
                    <Printer size={18} /> Exportar Informe PDF
                </button>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border print:shadow-none">
                    <p className="text-xs text-gray-500 uppercase font-bold">Presupuesto Inicial</p>
                    <p className="text-2xl font-mono font-bold text-gray-800 mt-2">€{totalBudget.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border print:shadow-none">
                    <p className="text-xs text-gray-500 uppercase font-bold">Gasto Actual</p>
                    <p className={`text-2xl font-mono font-bold mt-2 ${totalReal > totalBudget ? 'text-orange-600' : 'text-blue-600'}`}>
                        €{totalReal.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border print:shadow-none">
                    <p className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                        Proyección Final <TrendingUp size={14} />
                    </p>
                    <p className={`text-2xl font-mono font-bold mt-2 ${totalProjected > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                        €{totalProjected.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Desviación Est: {totalBudget > 0 ? ((totalProjected - totalBudget) / totalBudget * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            {/* Phase Breakdown Section */}
            <div className="mb-8">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Layers size={18} /> Rentabilidad por Fase / Subproyecto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                    {phaseMetrics.map(phase => {
                        const isOverBudget = phase.cost > phase.budget;
                        return (
                            <div key={phase.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: phase.color }}></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{phase.name}</h4>
                                        <p className="text-xs text-gray-500">{phase.taskCount} tareas activas</p>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${isOverBudget ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {isOverBudget ? 'Sobre Coste' : 'En Presupuesto'}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="pl-3 mb-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Consumido: {phase.percentUsed.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(phase.percentUsed, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="pl-3 grid grid-cols-3 gap-2 text-sm">
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase">Presupuesto</span>
                                        <span className="font-mono text-gray-600">€{phase.budget.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase">Coste Real</span>
                                        <span className={`font-mono font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>€{phase.cost.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase">Proyección</span>
                                        <span className="font-mono text-gray-600">€{phase.projected.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Vendor Breakdown Section */}
            <div className="mb-8">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Briefcase size={18} /> Gastos por Proveedor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                    {vendorMetrics.map(vendor => {
                        const isOverBudget = vendor.cost > vendor.budget;
                        return (
                            <div key={vendor.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{vendor.name}</h4>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{vendor.type}</span>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${isOverBudget ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {isOverBudget ? 'Desvío' : 'OK'}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Ejecutado: {vendor.percentUsed.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(vendor.percentUsed, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-100 pt-3">
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase">Presupuesto</span>
                                        <span className="font-mono text-gray-600">€{vendor.budget.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-gray-400 uppercase">Coste Real</span>
                                        <span className={`font-mono font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>€{vendor.cost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {vendorMetrics.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            No hay gastos asignados a proveedores externos aún.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Task Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:border print:shadow-none">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-700 text-sm uppercase">Detalle de Gastos por Tarea</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-medium print:bg-gray-100">
                        <tr>
                            <th className="px-6 py-4">Tarea / Concepto</th>
                            <th className="px-6 py-4">Fase</th>
                            <th className="px-6 py-4">Proveedor</th>
                            <th className="px-6 py-4 text-right">Presupuesto</th>
                            <th className="px-6 py-4 text-right">Coste Real</th>
                            <th className="px-6 py-4 text-right">Proyección</th>
                            <th className="px-6 py-4 text-right">Var.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedTasks.map(task => {
                            const variance = task.costReal - task.budgetEstimated;
                            const isOverBudget = variance > 0;
                            const vendorName = state.vendors.find(v => v.id === task.vendorId)?.name || '-';
                            const phaseName = state.subProjects.find(sp => sp.id === task.subProjectId)?.name || 'General';
                            const projection = task.projectedCost || task.costReal; // Fallback to current cost if no projection

                            // Don't show empty tasks in finance view to keep report clean
                            if (task.budgetEstimated === 0 && task.costReal === 0) return null;

                            return (
                                <tr key={task.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {task.title}
                                        {isOverBudget && <AlertTriangle size={12} className="inline-block ml-2 text-red-500 print:hidden" />}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">{phaseName}</td>
                                    <td className="px-6 py-4 text-gray-500 truncate max-w-[150px]">{vendorName}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-600">€{task.budgetEstimated.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-600">€{task.costReal.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-blue-600 bg-blue-50/50 print:bg-transparent">
                                        €{projection.toLocaleString()}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                                        {isOverBudget ? '+' : ''}{variance.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200 print:bg-gray-100">
                        <tr>
                            <td className="px-6 py-4" colSpan={3}>TOTALES PROYECTO</td>
                            <td className="px-6 py-4 text-right">€{totalBudget.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">€{totalReal.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">€{totalProjected.toLocaleString()}</td>
                            <td className={`px-6 py-4 text-right ${(totalProjected - totalBudget) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                €{(totalReal - totalBudget).toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400 print:block hidden">
                <p>SportsCenter Manager - Informe Generado el {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
};