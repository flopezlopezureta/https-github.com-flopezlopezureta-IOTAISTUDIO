
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { Company, User, ServiceStatus } from '../types';
import UserManagementSubPanel from './UserManagementSubPanel';

interface CompanyManagerProps {
  onCreateClick: () => void;
}

const CompanyManager: React.FC<CompanyManagerProps> = ({ onCreateClick }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [selectedCompanyForUsers, setSelectedCompanyForUsers] = useState<Company | null>(null);

  useEffect(() => {
    refreshCompanies();
  }, []);

  const refreshCompanies = () => {
    setCompanies(databaseService.getCompanies());
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta empresa?')) {
      databaseService.deleteCompany(id);
      refreshCompanies();
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      databaseService.updateCompany(editingCompany.id, editingCompany);
      setEditingCompany(null);
      refreshCompanies();
    }
  };

  if (selectedCompanyForUsers) {
    return <UserManagementSubPanel company={selectedCompanyForUsers} onBack={() => setSelectedCompanyForUsers(null)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-white font-bold text-xl uppercase tracking-tight">Clientes del Hub</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Gestión local de activos</p>
        </div>
        <button onClick={onCreateClick} className="px-6 py-2.5 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all">
          + Nueva Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map(c => (
          <div key={c.id} className="bg-[#1e293b] p-6 rounded-[2rem] border border-slate-800/50 flex flex-col gap-6 relative group">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-cyan-400 font-bold text-xl border border-slate-800">
                  {c.name[0]}
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase tracking-tight">{c.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {c.id}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${c.service_status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {c.service_status}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditingCompany(c)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Editar</button>
              <button onClick={() => setSelectedCompanyForUsers(c)} className="flex-1 py-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-[#0f172a] transition-all">Usuarios</button>
              <button onClick={() => handleDelete(c.id)} className="px-4 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">X</button>
            </div>
          </div>
        ))}
      </div>

      {editingCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-slate-800 rounded-[2.5rem] p-8 max-w-lg w-full">
            <h4 className="text-white font-bold text-lg uppercase tracking-widest mb-6">Editar Empresa</h4>
            <form onSubmit={handleUpdate} className="space-y-4">
              <input required value={editingCompany.name} onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white" />
              <select value={editingCompany.service_status} onChange={e => setEditingCompany({...editingCompany, service_status: e.target.value as ServiceStatus})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white">
                <option value="active">Activo</option>
                <option value="suspended">Suspendido</option>
              </select>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingCompany(null)} className="flex-1 py-4 bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManager;
