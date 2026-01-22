
import React, { useState, useEffect } from 'react';
import { databaseService } from '../services/databaseService';
import { generateIoTCode } from '../services/geminiService';
import { HardwareType, SensorType, ProtocolType, NetworkMode, Company, Device, SIMProvider, HttpConfig, MqttConfig } from '../types';
import { HARDWARE_CATALOG } from '../services/hardwareProfiles';
import CodeViewer from './CodeViewer';

interface DeviceCreatorProps {
  onSuccess: () => void;
  onCancel: () => void;
  companies: Company[];
  editDevice?: Device | null;
}

const DeviceCreator: React.FC<DeviceCreatorProps> = ({ onSuccess, onCancel, companies, editDevice }) => {
  // Estado base
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    mac_address: '',
    company_id: '',
    type: SensorType.LEVEL,
    unit: 'm',
    interval: 30
  });

  // Estado de Hardware
  const [selectedHardware, setSelectedHardware] = useState<HardwareType>(HardwareType.T_SIM7080_S3);
  const [networkMode, setNetworkMode] = useState<NetworkMode>(NetworkMode.CAT_M1);
  const [protocol, setProtocol] = useState<ProtocolType>(ProtocolType.HTTP_POST);

  // Configuraciones específicas
  const [simConfig, setSimConfig] = useState<SIMProvider>(SIMProvider.ENTEL);
  const [wifiConfig, setWifiConfig] = useState({ ssid: '', pass: '' });
  
  const [httpConfig, setHttpConfig] = useState<HttpConfig>({
    endpoint: 'https://regentry.cl/api/iot_backend.php',
    method: 'POST'
  });

  const [mqttConfig, setMqttConfig] = useState<MqttConfig>({
    broker: 'broker.hivemq.com',
    port: 1883,
    clientId: 'selcom_device_' + Math.floor(Math.random() * 1000),
    topicPub: 'selcom/data',
    topicSub: 'selcom/cmd'
  });

  // IA Generation States
  const [loadingStep, setLoadingStep] = useState(0);
  const [previewCode, setPreviewCode] = useState<{code: string, explanation: string} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentProfile = HARDWARE_CATALOG[selectedHardware];

  // Pre-llenado al editar
  useEffect(() => {
    if (editDevice) {
      setBasicInfo({
        name: editDevice.name,
        mac_address: editDevice.mac_address,
        company_id: editDevice.company_id,
        type: editDevice.type as SensorType,
        unit: editDevice.unit,
        interval: editDevice.hardwareConfig?.interval || 30
      });
      if (editDevice.hardwareConfig) {
        setSelectedHardware(editDevice.hardwareConfig.hardware);
        setNetworkMode(editDevice.hardwareConfig.networkMode);
        setProtocol(editDevice.hardwareConfig.protocol);
        
        if (editDevice.hardwareConfig.simProvider) setSimConfig(editDevice.hardwareConfig.simProvider);
        if (editDevice.hardwareConfig.wifiSSID) setWifiConfig({ ssid: editDevice.hardwareConfig.wifiSSID, pass: editDevice.hardwareConfig.wifiPass || '' });
        
        // Determinar si es HTTP o MQTT para cargar la config
        if ('endpoint' in editDevice.hardwareConfig.commConfig) {
           setHttpConfig(editDevice.hardwareConfig.commConfig as HttpConfig);
        } else {
           setMqttConfig(editDevice.hardwareConfig.commConfig as MqttConfig);
        }
      }
    } else if (companies.length > 0 && !basicInfo.company_id) {
      setBasicInfo(prev => ({ ...prev, company_id: companies[0].id }));
    }
  }, [editDevice, companies]);

  // Resetear modo de red si cambia el hardware y no es compatible
  useEffect(() => {
    if (!currentProfile.supportedNetworks.includes(networkMode)) {
      setNetworkMode(currentProfile.supportedNetworks[0]);
    }
    if (!currentProfile.supportedProtocols.includes(protocol)) {
      setProtocol(currentProfile.supportedProtocols[0]);
    }
  }, [selectedHardware]);

  // Animación de carga
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      const msgs = ["Analizando perfil de hardware...", "Cargando librerías de protocolo...", "Configurando stack de red...", "Optimizando consumo...", "Generando sketch C++..."];
      interval = setInterval(() => setLoadingStep(p => (p + 1) % msgs.length), 1500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    setPreviewCode(null);
    try {
      // Preparamos la configuración de comunicación para enviarla a la IA
      const commConfig = protocol.includes('MQTT') ? mqttConfig : httpConfig;
      
      const result = await generateIoTCode(
        selectedHardware,
        basicInfo.type,
        protocol,
        networkMode,
        commConfig, // Pasamos el objeto completo
        currentProfile.requiresSim ? simConfig : undefined,
        currentProfile.requiresWifi ? wifiConfig : undefined
      );
      setPreviewCode(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCommConfig = protocol.includes('MQTT') ? mqttConfig : httpConfig;

    const config: any = {
      name: basicInfo.name,
      mac_address: basicInfo.mac_address,
      company_id: basicInfo.company_id,
      type: basicInfo.type,
      unit: basicInfo.unit,
      hardwareConfig: {
        hardware: selectedHardware,
        sensor: basicInfo.type,
        protocol: protocol,
        networkMode: networkMode,
        interval: basicInfo.interval,
        commConfig: finalCommConfig,
        // Campos opcionales según hardware
        simProvider: currentProfile.requiresSim ? simConfig : undefined,
        wifiSSID: currentProfile.requiresWifi ? wifiConfig.ssid : undefined,
        wifiPass: currentProfile.requiresWifi ? wifiConfig.pass : undefined,
      }
    };

    if (editDevice) {
      databaseService.updateDevice(editDevice.id, config);
    } else {
      databaseService.addDevice(config);
    }
    onSuccess();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
      <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 lg:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
          <div className="p-3 bg-cyan-500 rounded-2xl text-[#0f172a]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h2 className="text-white text-2xl font-black uppercase tracking-tight">Alta de Dispositivo</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Configuración de Hardware & Comunicaciones</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* SECCIÓN 1: DATOS ADMINISTRATIVOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] border-l-2 border-cyan-500 pl-3">1. Identidad del Activo</h3>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Nombre Identificador</label>
                <input required value={basicInfo.name} onChange={e => setBasicInfo({...basicInfo, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="Ej: Sensor Tanque Principal" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">MAC / IMEI (Identificador Único)</label>
                <input required value={basicInfo.mac_address} onChange={e => setBasicInfo({...basicInfo, mac_address: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white font-mono" placeholder="XX:XX:XX:XX:XX:XX" />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] border-l-2 border-amber-500 pl-3">2. Variables de Proceso</h3>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Tipo de Sensor</label>
                <select value={basicInfo.type} onChange={e => setBasicInfo({...basicInfo, type: e.target.value as SensorType})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white outline-none">
                  {Object.values(SensorType).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Unidad de Medida</label>
                  <input required value={basicInfo.unit} onChange={e => setBasicInfo({...basicInfo, unit: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">Intervalo (Seg)</label>
                  <input type="number" min="5" value={basicInfo.interval} onChange={e => setBasicInfo({...basicInfo, interval: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: HARDWARE Y RED */}
          <div className="bg-slate-900/30 p-8 rounded-[2rem] border border-slate-800 space-y-8">
            <h3 className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border-l-2 border-emerald-500 pl-3">3. Perfil de Hardware</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                 <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Placa / Dispositivo</label>
                 <select value={selectedHardware} onChange={e => setSelectedHardware(e.target.value as HardwareType)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold">
                   {Object.values(HARDWARE_CATALOG).map(hw => <option key={hw.id} value={hw.id}>{hw.name} - {hw.description}</option>)}
                 </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Modo de Red</label>
                <select value={networkMode} onChange={e => setNetworkMode(e.target.value as NetworkMode)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm">
                  {currentProfile.supportedNetworks.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              {currentProfile.requiresSim && (
                <div className="animate-in fade-in">
                  <label className="block text-[10px] font-black text-cyan-500 mb-2 uppercase">Operador (APN)</label>
                  <select value={simConfig} onChange={e => setSimConfig(e.target.value as SIMProvider)} className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-sm focus:ring-1 focus:ring-cyan-500">
                    {Object.values(SIMProvider).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              )}

              {currentProfile.requiresWifi && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4 animate-in fade-in">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">SSID WiFi</label>
                    <input value={wifiConfig.ssid} onChange={e => setWifiConfig({...wifiConfig, ssid: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" placeholder="Mi_Red_WiFi" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Password WiFi</label>
                    <input type="password" value={wifiConfig.pass} onChange={e => setWifiConfig({...wifiConfig, pass: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 3: PROTOCOLO */}
          <div className="bg-[#0f172a] p-8 rounded-[2rem] border border-indigo-500/20 shadow-lg">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">4. Protocolo de Comunicación</h3>
               <select value={protocol} onChange={e => setProtocol(e.target.value as ProtocolType)} className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-1 text-indigo-300 text-xs font-bold uppercase">
                  {currentProfile.supportedProtocols.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
             </div>

             {/* Configuración HTTP */}
             {protocol.includes('HTTP') && (
               <div className="animate-in fade-in space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">URL Endpoint (Webhook)</label>
                    <input value={httpConfig.endpoint} onChange={e => setHttpConfig({...httpConfig, endpoint: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-4 text-cyan-400 font-mono text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Método</label>
                      <select value={httpConfig.method} onChange={e => setHttpConfig({...httpConfig, method: e.target.value as any})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm">
                        <option value="POST">POST (JSON)</option>
                        <option value="PUT">PUT</option>
                        <option value="GET">GET (Query Params)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Auth Header (Opcional)</label>
                      <input value={httpConfig.authHeader} onChange={e => setHttpConfig({...httpConfig, authHeader: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" placeholder="Bearer eyJhbG..." />
                    </div>
                  </div>
               </div>
             )}

             {/* Configuración MQTT */}
             {protocol.includes('MQTT') && (
               <div className="animate-in fade-in space-y-4">
                 <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                       <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Broker URL</label>
                       <input value={mqttConfig.broker} onChange={e => setMqttConfig({...mqttConfig, broker: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-indigo-400 font-mono text-sm" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Puerto</label>
                       <input type="number" value={mqttConfig.port} onChange={e => setMqttConfig({...mqttConfig, port: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Usuario MQTT</label>
                       <input value={mqttConfig.username} onChange={e => setMqttConfig({...mqttConfig, username: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Password</label>
                       <input type="password" value={mqttConfig.password} onChange={e => setMqttConfig({...mqttConfig, password: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase">Tópico Publicación</label>
                    <input value={mqttConfig.topicPub} onChange={e => setMqttConfig({...mqttConfig, topicPub: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-emerald-400 font-mono text-sm" />
                 </div>
                 <p className="text-[10px] text-indigo-400 italic mt-2">* Asegúrate de que el Broker sea accesible desde la red celular o WiFi seleccionada.</p>
               </div>
             )}
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-4 border-t border-slate-800 pt-8">
            <button type="button" onClick={onCancel} className="px-8 py-4 bg-slate-800 text-slate-300 rounded-2xl text-[10px] font-black uppercase">Cancelar</button>
            <button type="button" onClick={handleGeneratePreview} disabled={isGenerating} className="px-8 py-4 bg-slate-800 text-cyan-400 border border-cyan-500/20 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-700 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              {isGenerating ? 'Programando...' : 'Generar Sketch'}
            </button>
            <button type="submit" className="px-10 py-4 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-cyan-900/20 hover:bg-cyan-500 transition-all">
              {editDevice ? 'Guardar Cambios' : 'Proveer Activo'}
            </button>
          </div>
        </form>
        
        {isGenerating && (
          <div className="mt-8 p-6 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-4 justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-white text-xs font-bold uppercase animate-pulse">IA Selcom: {["Analizando hardware...", "Escribiendo drivers...", "Validando conectividad..."][loadingStep % 3]}</span>
          </div>
        )}

        {previewCode && !isGenerating && (
           <div className="mt-12 space-y-4 animate-in slide-in-from-bottom-10">
              <h4 className="text-white font-black text-[10px] uppercase tracking-widest border-l-2 border-cyan-500 pl-3">
                 Sketch Generado ({protocol} sobre {networkMode})
              </h4>
              <CodeViewer code={previewCode.code} explanation={previewCode.explanation} />
           </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCreator;
