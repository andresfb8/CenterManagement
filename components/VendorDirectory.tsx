import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Phone, Mail, User, ArrowUpRight } from 'lucide-react';

export const VendorDirectory = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { state } = context;

  const getEmailLink = (vendorName: string, email: string) => {
      const subject = encodeURIComponent(`Proyecto SportsCenter - Consulta`);
      const body = encodeURIComponent(`Hola ${vendorName},\n\nContactamos en referencia a las tareas asignadas en el proyecto SportsCenter.\n\nSaludos,\nEl equipo de Gestión.`);
      return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
       <div className="flex justify-between items-center mb-6">
           <div>
                <h2 className="text-2xl font-bold text-gray-800">Directorio de Proveedores</h2>
                <p className="text-gray-500">Contactos externos y empresas contratadas.</p>
           </div>
           <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hidden md:block">
               Exportar CSV
           </button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.vendors.map(vendor => {
             const activeTasks = state.tasks.filter(t => t.vendorId === vendor.id && t.status !== 'done').length;
             
             return (
                <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User size={24} />
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        {vendor.type}
                    </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{vendor.name}</h3>
                    <p className="text-sm text-gray-400 mb-6 font-mono">{vendor.id}</p>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <a 
                            href={`tel:${vendor.phone.replace(/\s+/g, '')}`}
                            className="flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-2.5 rounded-lg transition text-sm font-medium"
                        >
                            <Phone size={16} /> Llamar
                        </a>
                        <a 
                            href={getEmailLink(vendor.name, vendor.email)}
                            className="flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-2.5 rounded-lg transition text-sm font-medium"
                        >
                            <Mail size={16} /> Email
                        </a>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Estado Actual</span>
                        {activeTasks > 0 ? (
                            <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                {activeTasks} Tareas Activas <ArrowUpRight size={12}/>
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-gray-400">Sin asignaciones</span>
                        )}
                    </div>
                </div>
             );
          })}
       </div>
    </div>
  );
};