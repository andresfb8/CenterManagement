import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Phone, Mail, User } from 'lucide-react';

export const VendorDirectory = () => {
  const context = useContext(AppContext);
  if (!context) return null;
  const { state } = context;

  return (
    <div className="max-w-5xl mx-auto">
       <h2 className="text-2xl font-bold text-gray-800 mb-6">Directorio de Proveedores</h2>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.vendors.map(vendor => (
             <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                   <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <User size={24} />
                   </div>
                   <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      {vendor.type}
                   </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800">{vendor.name}</h3>
                
                <div className="mt-6 space-y-3">
                   <a href={`tel:${vendor.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition">
                      <Phone size={18} />
                      <span className="text-sm">{vendor.phone}</span>
                   </a>
                   <a href={`mailto:${vendor.email}`} className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition">
                      <Mail size={18} />
                      <span className="text-sm">{vendor.email}</span>
                   </a>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                   <p className="text-xs text-gray-400">
                      Tareas Activas: {state.tasks.filter(t => t.vendorId === vendor.id && t.status !== 'done').length}
                   </p>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};