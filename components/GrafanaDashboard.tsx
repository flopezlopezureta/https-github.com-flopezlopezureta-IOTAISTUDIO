
import React, { useState, useEffect } from 'react';
import { Device, DashboardWidget, WidgetType } from '../types';

interface GrafanaDashboardProps {
  devices: Device[];
}

const GrafanaDashboard: React.FC<GrafanaDashboardProps> = ({ devices }) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('selcom_custom_dashboard');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Estado para el formulario de nuevo widget
  const [newWidget, setNewWidget] = useState<{title: string, deviceId: string, type: WidgetType, size: 'small'|'medium'|'large'}>({
    title: '',
    deviceId: devices[0]?.id || '',
    type: 'METRIC',
    size: 'small'
  });

  useEffect(() => {
    localStorage.setItem('selcom_custom_dashboard', JSON.stringify(widgets));
  }, [widgets]);

  const addWidget = () => {
    const widget: DashboardWidget = {
      id: `w-${Date.now()}`,
      ...newWidget
    };
    setWidgets([...widgets, widget]);
    setShowAddModal(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-white font-bold text-xl uppercase tracking-tight flex items-center gap-3">
             <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
             Panel Personalizado
          </h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Visualización estilo Grafana</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setIsEditMode(!isEditMode)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${isEditMode ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {isEditMode ? 'Terminar Edición' : 'Editar Panel'}
           </button>
           <button onClick={() => { if(devices.length>0) setNewWidget({...newWidget, deviceId: devices[0].id}); setShowAddModal(true); }} className="px-4 py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20">
              + Widget
           </button>
        </div>
      </div>

      {widgets.length === 0 ? (
        <div className="bg-[#1e293b] border border-dashed border-slate-700 rounded-[2rem] p-20 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
           </div>
           <h4 className="text-white font-bold text-lg mb-2">Panel Vacío</h4>
           <p className="text-slate-500 text-xs max-w-md mx-auto mb-6">Agrega widgets personalizados para monitorear tus dispositivos T-SIM7080-S3 y ESP32 en tiempo real.</p>
           <button onClick={() => { if(devices.length>0) setNewWidget({...newWidget, deviceId: devices[0].id}); setShowAddModal(true); }} className="px-6 py-3 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-cyan-500 transition-all">
              Crear primer Widget
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-min">
           {widgets.map(widget => {
              const device = devices.find(d => d.id === widget.deviceId);
              const colSpan = widget.size === 'large' ? 'md:col-span-2 lg:col-span-2' : widget.size === 'medium' ? 'md:col-span-2 lg:col-span-1' : '';
              
              return (
                 <div key={widget.id} className={`bg-[#1e293b] rounded-2xl border ${isEditMode ? 'border-amber-500/50 border-dashed' : 'border-slate-800/50'} p-5 relative group overflow-hidden ${colSpan} flex flex-col`}>
                    {isEditMode && (
                       <button onClick={() => removeWidget(widget.id)} className="absolute top-2 right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 hover:scale-110 transition-transform">×</button>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest truncate max-w-[70%]">{widget.title}</h4>
                       {device && <span className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>}
                    </div>

                    {!device ? (
                       <div className="flex-1 flex items-center justify-center text-slate-600 text-xs italic">Dispositivo no encontrado</div>
                    ) : (
                       <div className="flex-1 min-h-[100px]">
                          {widget.type === 'METRIC' && <WidgetMetric device={device} />}
                          {widget.type === 'GAUGE' && <WidgetGauge device={device} />}
                          {widget.type === 'GRAPH' && <WidgetGraph device={device} />}
                       </div>
                    )}
                 </div>
              );
           })}
        </div>
      )}

      {/* MODAL AGREGAR WIDGET */}
      {showAddModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
               <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Configurar Widget</h4>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Título del Panel</label>
                     <input className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm" value={newWidget.title} onChange={e => setNewWidget({...newWidget, title: e.target.value})} placeholder="Ej: Temperatura Principal" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Dispositivo Fuente</label>
                     <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm" value={newWidget.deviceId} onChange={e => setNewWidget({...newWidget, deviceId: e.target.value})}>
                        {devices.map(d => <option key={d.id} value={d.id}>{d.name} ({d.mac_address})</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Visualización</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm" value={newWidget.type} onChange={e => setNewWidget({...newWidget, type: e.target.value as WidgetType})}>
                           <option value="METRIC">Métrica Simple</option>
                           <option value="GAUGE">Velocímetro (Gauge)</option>
                           <option value="GRAPH">Gráfico de Línea</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tamaño</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm" value={newWidget.size} onChange={e => setNewWidget({...newWidget, size: e.target.value as any})}>
                           <option value="small">Pequeño (1x1)</option>
                           <option value="medium">Mediano (2x1)</option>
                           <option value="large">Grande (2x2)</option>
                        </select>
                     </div>
                  </div>
               </div>

               <div className="flex gap-3 mt-8">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase">Cancelar</button>
                  <button onClick={addWidget} disabled={!newWidget.title || !newWidget.deviceId} className="flex-1 py-3 bg-cyan-600 text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50">Agregar</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

// --- SUB COMPONENTES DE VISUALIZACIÓN ---

const WidgetMetric: React.FC<{device: Device}> = ({ device }) => (
   <div className="flex flex-col items-center justify-center h-full">
      <span className="text-4xl lg:text-5xl font-black text-cyan-400 tracking-tighter">{device.value.toFixed(1)}</span>
      <span className="text-slate-500 text-xs font-bold uppercase">{device.unit}</span>
      <p className="text-[9px] text-slate-600 mt-2 font-mono">{device.mac_address}</p>
   </div>
);

const WidgetGauge: React.FC<{device: Device}> = ({ device }) => {
   const min = device.thresholds?.min || 0;
   const max = device.thresholds?.max || 100;
   const percentage = Math.min(100, Math.max(0, ((device.value - min) / (max - min)) * 100));
   
   return (
      <div className="relative h-full flex items-center justify-center pt-4">
         <div className="w-32 h-16 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-slate-800"></div>
            <div 
               className="absolute top-0 left-0 w-32 h-32 rounded-full border-[12px] border-emerald-500 transition-all duration-1000 ease-out"
               style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', transform: `rotate(${(percentage * 1.8) - 180}deg)` }}
            ></div>
         </div>
         <div className="absolute bottom-4 flex flex-col items-center">
            <span className="text-xl font-bold text-white">{device.value.toFixed(0)}</span>
            <span className="text-[9px] text-slate-500 uppercase">{device.unit}</span>
         </div>
      </div>
   );
};

const WidgetGraph: React.FC<{device: Device}> = ({ device }) => {
   // Simulamos historia local basada en el valor actual para efecto visual
   const [history, setHistory] = useState<number[]>([]);
   
   useEffect(() => {
      // Inicializar
      setHistory(Array(20).fill(device.value));
   }, []);

   useEffect(() => {
      setHistory(prev => {
         const next = [...prev, device.value];
         if(next.length > 20) next.shift();
         return next;
      });
   }, [device.value]);

   const min = Math.min(...history, device.thresholds?.min || 0) - 5;
   const max = Math.max(...history, device.thresholds?.max || 100) + 5;
   const range = max - min;
   
   const points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
   }).join(' ');

   return (
      <div className="w-full h-full flex flex-col justify-end pb-2">
         <div className="flex-1 relative w-full overflow-hidden">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
               <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                     <stop offset="0%" style={{stopColor:'rgb(34, 211, 238)', stopOpacity:0.5}} />
                     <stop offset="100%" style={{stopColor:'rgb(34, 211, 238)', stopOpacity:0}} />
                  </linearGradient>
               </defs>
               <path d={`M 0,100 ${points} L 100,100`} fill="url(#grad1)" />
               <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="2" />
            </svg>
         </div>
         <div className="flex justify-between px-1 mt-1">
             <span className="text-[9px] font-mono text-slate-600">-60s</span>
             <span className="text-[9px] font-mono text-cyan-400 font-bold">{device.value.toFixed(1)} {device.unit}</span>
         </div>
      </div>
   );
};

export default GrafanaDashboard;
