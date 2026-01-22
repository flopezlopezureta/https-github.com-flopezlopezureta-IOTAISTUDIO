
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { User } from '../types';

interface UserManagerProps {
  user: User;
}

const UserManager: React.FC<UserManagerProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    refreshUsers();
  }, [user]);

  const refreshUsers = () => {
    const fetchedUsers = databaseService.getUsers(user.role === 'admin' ? undefined : user.company_id);
    setUsers(fetchedUsers);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('¿Eliminar acceso de usuario?')) {
      databaseService.deleteUser(id);
      refreshUsers();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-white font-bold text-xl uppercase tracking-tight">Usuarios del Sistema</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Persistencia Local</p>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-[2rem] border border-slate-800/50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
              <th className="px-8 py-5">Usuario / Nombre</th>
              <th className="px-8 py-5">Rol</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-white">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-8 py-5">
                  <p className="font-bold">{u.full_name}</p>
                  <p className="text-[10px] text-slate-500">@{u.username}</p>
                </td>
                <td className="px-8 py-5 uppercase text-[10px] font-bold">{u.role}</td>
                <td className="px-8 py-5 text-right">
                  {u.id !== user.id && (
                    <button onClick={() => handleDeleteUser(u.id)} className="text-rose-400 hover:text-rose-300">Eliminar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManager;
