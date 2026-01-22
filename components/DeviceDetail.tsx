
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Device, SensorType, HttpConfig, MqttConfig } from '../types';
import { generateIoTCode } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import CodeViewer from './CodeViewer';

interface DeviceDetailProps {
  device: Device;
  onBack: () => void;
  onRefresh: () => void;
}

type TabType = 'monitoring' | 'history' | 'firmware' | 'connectivity';

const DeviceDetail: React.FC<DeviceDetailProps> = ({ device, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<TabType>('monitoring');
  const [dataPoints, setDataPoints] = useState<{ value: number; time: string; date: string; timestamp: number }[]>([]);
  
  const [minThreshold, setMinThreshold] = useState<number>(device.thresholds?.min ?? 20);
  const [maxThreshold, setMaxThreshold] = useState<number>(device.thresholds?.max ?? 80);
  
  const [intervalSec, setIntervalSec] = useState<number>(device.hardwareConfig?.interval || 10);
  const [timeRange, setTimeRange] = useState<number>(5);
  const [draggingThreshold, setDraggingThreshold] = useState<'min' | 'max' | null>(null);
  
  const [generatedSketch, setGeneratedSketch] = useState<{code: string, explanation: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (device.thresholds) {
      setMinThreshold(device.thresholds.min);
      setMaxThreshold(device.thresholds.max);
    }
  }, [device.id, device.thresholds]);

  useEffect(() => {
    const now = new Date();
    const pointsCount = 60;
    const msPerPoint = (timeRange * 60 * 1000) / pointsCount;

    const initial = Array.from({ length: pointsCount }, (_, i) => {
      const ts = now.getTime() - (pointsCount - 1 - i) * msPerPoint;
      const d = new Date(ts);
      return {
        value: device.value + Math.sin(i * 0.3) * 5 + (Math.random() - 0.5) * 2,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: d.toLocaleDateString(),
        timestamp: ts
      };
    });
    setDataPoints(initial);
  }, [device.id, timeRange]);

  useEffect(() => {
    const now = new Date();
    const newPoint = {
      value: device.value,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: now.toLocaleDateString(),
      timestamp: now.getTime()
    };
    
    setDataPoints(prev => {
      if (prev.length > 0 && Math.abs(prev[prev.length - 1].timestamp - newPoint.timestamp) < 500) {
        return prev;
      }
      return [...prev.slice(1), newPoint];
    });
  }, [device.value]);

  const chartScales = useMemo(() => {
    if (dataPoints.length === 0) return { yTicks: [], xTicks: [], pathPoints: [], minThresholdY: 150, maxThresholdY: 50, range: 100, minVal: 0, maxVal: 100 };
    const vals = dataPoints.map(p => p.value);
    const minVal = Math.min(...vals, minThreshold) - 5;
    const maxVal = Math.max(...vals, maxThreshold) + 5;
    const range = Math.max(1, maxVal - minVal);
    const yTicks = Array.from({ length: 5 }, (_, i) => ({ value: (maxVal - (range / 4) * i).toFixed(1), pos: (i / 4) * 300 }));
    const xTicks = Array.from({ length: 6 }, (_, i) => ({ label: dataPoints[Math.floor((i / 5) * (dataPoints.length - 1))]?.time || '', pos: (i / 5) * 1000 }));
    const pathPoints = dataPoints.map((d, i) => ({ x: (i / (dataPoints.length - 1)) * 1000, y: 300 - ((d.value - minVal) / range) * 300 }));

    return { yTicks, xTicks, pathPoints, minThresholdY: 300 - ((minThreshold - minVal) / range) * 300, maxThresholdY: 300 - ((maxThreshold - minVal) / range) * 300, minVal, maxVal, range };
  }, [dataPoints, minThreshold, maxThreshold]);

  const isOutOfRange = device.value < minThreshold || device.value > maxThreshold;

  const getEndpointOrBroker = () => {
    if (!device.hardwareConfig?.commConfig) return 'N/A';
    if ('endpoint' in device.hardwareConfig.commConfig) {
      return (device.hardwareConfig.commConfig as HttpConfig).endpoint;
    }
    if ('broker' in device.hardwareConfig.commConfig) {
      return (device.hardwareConfig.commConfig as MqttConfig).broker;
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 select-none" 
         onMouseUp={() => setDraggingThreshold(null)}
         onMouseLeave={() => setHoverIndex(null)}>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-slate-800 text-slate-300 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg></button>
          <div>
            <h2 className="text-white text-xl font-bold truncate">{device.name}</h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{device.mac_address}</p>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto shadow-inner no-scrollbar">
          {['monitoring', 'history', 'firmware', 'connectivity'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as TabType)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-cyan-500 text-[#0f172a]' : 'text-slate-500 hover:text-slate-300'}`}>{t === 'connectivity' ? 'DEBUG' : t}</button>
          ))}
        </div>
      </div>

      {activeTab === 'monitoring' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#1e293b] rounded-[2rem] border border-slate-800/40 p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-white font-bold text-xs tracking-widest uppercase">Live View</h3>
                </div>
                <div className="px-6 py-4 bg-slate-900 rounded-2xl border-2 border-cyan-500/40">
                  <span className={`text-4xl font-black ${isOutOfRange ? 'text-rose-400' : 'text-cyan-400'}`}>{device.value.toFixed(2)}</span>
                  <span className="text-white text-xs font-black uppercase ml-1">{device.unit}</span>
                </div>
             </div>
             
             <div className="h-[300px] relative bg-slate-900/40 rounded-xl border border-slate-700/30 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  {chartScales.pathPoints.length > 0 && (
                    <path d={`M ${chartScales.pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`} fill="none" stroke="#22d3ee" strokeWidth="4" />
                  )}
                  <line x1="0" y1={chartScales.maxThresholdY} x2="1000" y2={chartScales.maxThresholdY} stroke="#f43f5e" strokeWidth="2" strokeDasharray="10,5" />
                  <line x1="0" y1={chartScales.minThresholdY} x2="1000" y2={chartScales.minThresholdY} stroke="#f43f5e" strokeWidth="2" strokeDasharray="10,5" />
                </svg>
             </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-[#1e293b] rounded-[2rem] border border-slate-800/40 p-8 shadow-2xl">
              <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-6 border-b border-slate-800 pb-4">Configuración</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Umbral Máximo</label>
                  <input type="range" min="0" max="100" value={maxThreshold} onChange={e => {
                    const v = parseFloat(e.target.value);
                    setMaxThreshold(v);
                    databaseService.updateDevice(device.id, { thresholds: { min: minThreshold, max: v } });
                  }} className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Umbral Mínimo</label>
                  <input type="range" min="0" max="100" value={minThreshold} onChange={e => {
                    const v = parseFloat(e.target.value);
                    setMinThreshold(v);
                    databaseService.updateDevice(device.id, { thresholds: { min: v, max: maxThreshold } });
                  }} className="w-full h-2 bg-slate-800 rounded-lg accent-cyan-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'connectivity' && (
        <div className="animate-in fade-in duration-500 space-y-8">
           <div className="bg-[#1e293b] rounded-[2rem] border border-slate-800/40 p-8">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Prueba de Conectividad (Modo Desarrollador)</h3>
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 font-mono text-xs text-cyan-400 leading-relaxed mb-6">
                <p className="text-slate-500 mb-4">// Copia y pega esto en la consola (F12) para simular al T-SIM7080-S3:</p>
                <code>simulateDeviceUpload("{device.mac_address}", 45.82);</code>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                  <h4 className="text-white font-bold text-[10px] uppercase mb-4 tracking-widest">Información de Red</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-slate-500 text-[10px] uppercase">Estado Hardware:</span><span className="text-emerald-400 font-bold uppercase text-[10px]">Ready</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 text-[10px] uppercase">Operador SIM:</span><span className="text-white font-bold uppercase text-[10px]">{device.hardwareConfig?.simProvider || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 text-[10px] uppercase">Frecuencia:</span><span className="text-white font-bold uppercase text-[10px]">{device.hardwareConfig?.interval}s</span></div>
                  </div>
                </div>
                
                <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                  <h4 className="text-rose-400 font-bold text-[10px] uppercase mb-4 tracking-widest">Estado Backend</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed italic mb-4">
                    Actualmente no hay un servidor real escuchando en {getEndpointOrBroker()}.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span className="text-[9px] text-rose-500 font-black uppercase">Falta API REST / Webhook</span>
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'firmware' && (
        <div className="animate-in fade-in duration-500">
          <div className="bg-[#1e293b] rounded-[2rem] border border-slate-800/40 p-8 shadow-2xl mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-1">Firmware Generator</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase">Código para {device.hardwareConfig?.hardware}</p>
              </div>
              <button onClick={async () => {
                if (!device.hardwareConfig) return;
                setIsGenerating(true);
                try {
                  const wifiConfig = device.hardwareConfig.wifiSSID ? { ssid: device.hardwareConfig.wifiSSID, pass: device.hardwareConfig.wifiPass || '' } : undefined;
                  const res = await generateIoTCode(
                    device.hardwareConfig.hardware, 
                    device.type as SensorType, 
                    device.hardwareConfig.protocol, 
                    device.hardwareConfig.networkMode,
                    device.hardwareConfig.commConfig,
                    device.hardwareConfig.simProvider,
                    wifiConfig
                  );
                  setGeneratedSketch(res);
                } catch(e) { console.error(e); } finally { setIsGenerating(false); }
              }} disabled={isGenerating} className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                {isGenerating ? 'Generando...' : 'Obtener Código C++'}
              </button>
            </div>
          </div>
          {generatedSketch && <CodeViewer code={generatedSketch.code} explanation={generatedSketch.explanation} />}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-[#1e293b] rounded-[2rem] border border-slate-800/40 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
             <thead className="bg-slate-900/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                <tr><th className="px-8 py-4">Fecha/Hora</th><th className="px-8 py-4">Valor</th><th className="px-8 py-4">Estado</th></tr>
             </thead>
             <tbody className="divide-y divide-slate-800/50">
                {[...dataPoints].reverse().map((p, i) => (
                  <tr key={i} className="hover:bg-slate-800/20"><td className="px-8 py-4 text-xs font-mono">{p.date} {p.time}</td><td className="px-8 py-4 text-white font-bold">{p.value.toFixed(2)} {device.unit}</td><td className="px-8 py-4"><span className="text-[10px] font-black uppercase text-emerald-400">OK</span></td></tr>
                ))}
             </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
