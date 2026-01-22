
import React, { useMemo } from 'react';
import { Device, User } from '../types';

interface DashboardProps {
  user: User;
  devices: Device[];
  onSelectDevice: (device: Device) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, devices, onSelectDevice }) => {
  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const offline = devices.filter(d => d.status === 'offline').length;
    return {
      total: total.toString().padStart(2, '0'),
      online: online.toString().padStart(2, '0'),
      offline: offline.toString().padStart(2, '0'),
    };
  }, [devices]);

  const SummaryCard = ({ icon, label, value, colorClass }: any) => (
    <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800/50 flex items-center gap-5 group hover:border-cyan-500/30 transition-all">
      <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white text-3xl font-extrabold">{value}</p>
      </div>
    </div>
  );

  const ChecklistItem = ({ done, text }: { done: boolean, text: string }) => (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-4 h-4 rounded-md flex items-center justify-center ${done ? 'bg-emerald-500 text-[#0f172a]' : 'border border-slate-700'}`}>
        {done && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
      </div>
      <span className={`text-[11px] font-bold uppercase tracking-tight ${done ? 'text-slate-300' : 'text-slate-600 italic'}`}>{text}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Activos" value={stats.total} colorClass="bg-cyan-500/10 text-cyan-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} />
        <SummaryCard label="Online" value={stats.online} colorClass="bg-emerald-500/10 text-emerald-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>} />
        <SummaryCard label="Alertas" value={stats.offline} colorClass="bg-rose-500/10 text-rose-400" icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1e293b] rounded-[2rem] border border-slate-800/50 p-8">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Actividad en Tiempo Real</h3>
          <div className="space-y-4">
            {devices.map(d => {
              const isAlarm = d.value < (d.thresholds?.min ?? 20) || d.value > (d.thresholds?.max ?? 80);
              return (
                <div key={d.id} onClick={() => onSelectDevice(d)} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group/row ${isAlarm ? 'bg-rose-500/5 border-rose-500/30' : 'bg-slate-900/30 border-slate-800/40 hover:bg-slate-800/60'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${d.status === 'online' ? (isAlarm ? 'bg-rose-500 animate-ping' : 'bg-emerald-400') : 'bg-slate-700'}`}></div>
                    <div>
                      <p className="text-white text-sm font-bold group-hover/row:text-cyan-400 transition-colors">{d.name}</p>
                      <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">{d.mac_address}</p>
                    </div>
                  </div>
                  <p className={`font-bold tabular-nums text-lg ${isAlarm ? 'text-rose-400' : 'text-cyan-400'}`}>{d.value.toFixed(2)} <span className="text-[10px] uppercase ml-1 opacity-60">{d.unit}</span></p>
                </div>
              );
            })}
          </div>
        </div>

        {user.role === 'admin' && (
          <div className="bg-[#1e293b] rounded-[2rem] border border-cyan-500/20 p-8 shadow-xl shadow-cyan-950/10">
            <h3 className="text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Checklist Producción
            </h3>
            <div className="space-y-1">
              <ChecklistItem done={true} text="Interfaz de Usuario (UX/UI)" />
              <ChecklistItem done={true} text="Provisionamiento vía IA" />
              <ChecklistItem done={false} text="API Backend (Node.js/PHP)" />
              <ChecklistItem done={false} text="Base de Datos Central (SQL)" />
              <ChecklistItem done={false} text="Certificado SSL (HTTPS)" />
              <ChecklistItem done={false} text="Webhook para T-SIM7080-S3" />
            </div>
            <div className="mt-8 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                Para recibir datos reales, el dispositivo debe enviar un POST JSON a tu servidor.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
