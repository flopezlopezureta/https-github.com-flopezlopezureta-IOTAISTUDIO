
import React from 'react';
import CodeViewer from './CodeViewer';

const Documentation: React.FC = () => {
  const httpExample = `/*
  T-SIM7080-S3 HTTP POST Data Uplink
  -----------------------------------
  Ejemplo de producción para enviar datos de sensores a Selcom Hub.
  Placa: LilyGO T-SIM7080-S3
  Librería: TinyGSM (v0.11.7 o superior)
*/

#define TINY_GSM_MODEM_SIM7080
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>

// --- PINOUT T-SIM7080-S3 ---
#define MODEM_TX 17
#define MODEM_RX 18
#define MODEM_PWR 41
#define MODEM_RST 42
#define BAT_ADC   4  // Pin lectura batería

// --- SENSOR PINS ---
#define SENSOR_PIN 5 // Ejemplo para sensor digital o analógico

// --- CREDENCIALES APN (Ej: Entel Chile) ---
const char apn[]  = "entel.tst"; 
const char user[] = "";
const char pass[] = "";

// --- DESTINO (Backend Selcom) ---
const char server[] = "regentry.cl";
const char path[] = "/api/iot_backend.php";
const int  port = 443; // HTTPS

HardwareSerial SerialAT(1);
TinyGsm modem(SerialAT);
TinyGsmClientSecure client(modem);
HttpClient http(client, server, port);

void setup() {
  Serial.begin(115200);
  delay(100);

  // 1. Encendido del Módem
  pinMode(MODEM_PWR, OUTPUT);
  digitalWrite(MODEM_PWR, HIGH);
  delay(100); // Pulso de 100ms
  digitalWrite(MODEM_PWR, LOW);
  
  // 2. Comunicación Serial con Módem
  SerialAT.begin(9600, SERIAL_8N1, MODEM_RX, MODEM_TX);
  
  Serial.println("Iniciando Sistema Selcom...");
  modem.restart();
  
  // 3. Conexión a Red Móvil
  Serial.print("Conectando APN: ");
  Serial.println(apn);
  if (!modem.gprsConnect(apn, user, pass)) {
    Serial.println("Error de conexión (Reintentando...)");
    delay(10000);
    return;
  }
  Serial.println("Conectado a LTE Cat-M1/NB-IoT");
}

void loop() {
  // A. LEER SENSORES
  // Ejemplo: Lectura analógica simulada (0-100)
  float sensorValue = analogRead(BAT_ADC) * (3.3 / 4095.0) * 2 + random(0, 5); 
  
  // B. CONSTRUIR PAYLOAD (JSON)
  // Formato estricto requerido por iot_backend.php
  String imei = modem.getIMEI();
  String payload = "{\"mac\":\"" + imei + "\", \"value\":" + String(sensorValue, 2) + "}";
  
  Serial.println("Enviando: " + payload);

  // C. ENVIAR HTTP POST
  http.beginRequest();
  http.post(path);
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("Content-Length", payload.length());
  http.beginBody();
  http.print(payload);
  http.endRequest();

  // D. VERIFICAR RESPUESTA
  int statusCode = http.responseStatusCode();
  String response = http.responseBody();

  Serial.print("Status: ");
  Serial.println(statusCode); // 200 = OK
  Serial.println("Respuesta: " + response);

  // E. DEEP SLEEP / ESPERA
  // En producción, usar esp_deep_sleep para ahorrar batería
  delay(60000); // Esperar 1 minuto
}
`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h3 className="text-white font-bold text-xl uppercase tracking-tight">Centro de Desarrollo</h3>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Recursos técnicos T-SIM7080-S3</p>
        </div>
        <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-400">
          v1.0.2-stable
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Info Técnica */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] p-6 rounded-[2rem] border border-slate-800/60 shadow-lg">
             <h4 className="text-cyan-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               Especificaciones Clave
             </h4>
             <p className="text-slate-400 text-[11px] leading-relaxed mb-4 text-justify">
               La placa <strong>LilyGO T-SIM7080-S3</strong> combina un ESP32-S3 (WiFi/BLE) con un módem SIM7080G (NB-IoT/Cat-M1). 
               Es ideal para zonas rurales con cobertura extendida.
             </p>
             <div className="space-y-2">
               <div className="flex justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                 <span className="text-slate-500 text-[10px] uppercase font-bold">Módem TX</span>
                 <span className="text-white text-[10px] font-mono">GPIO 17</span>
               </div>
               <div className="flex justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                 <span className="text-slate-500 text-[10px] uppercase font-bold">Módem RX</span>
                 <span className="text-white text-[10px] font-mono">GPIO 18</span>
               </div>
               <div className="flex justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                 <span className="text-slate-500 text-[10px] uppercase font-bold">Power Key</span>
                 <span className="text-white text-[10px] font-mono">GPIO 41</span>
               </div>
               <div className="flex justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                 <span className="text-slate-500 text-[10px] uppercase font-bold">Bat ADC</span>
                 <span className="text-white text-[10px] font-mono">GPIO 4</span>
               </div>
             </div>
          </div>
          
          <div className="bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/20">
             <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">Requisito Backend</h4>
             <p className="text-slate-400 text-[10px] leading-relaxed mb-3">
               El dispositivo debe enviar un JSON con esta estructura exacta para ser aceptado por <code>iot_backend.php</code>:
             </p>
             <div className="bg-slate-950 p-3 rounded-lg border border-slate-900">
               <code className="text-emerald-400 text-[10px] font-mono">
                 &#123;<br/>
                 &nbsp;&nbsp;"mac": "86429...",<br/>
                 &nbsp;&nbsp;"value": 24.5<br/>
                 &#125;
               </code>
             </div>
          </div>
        </div>

        {/* Columna Derecha: Código */}
        <div className="lg:col-span-2">
           <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest">Ejemplo Maestro: Lectura & Envío (HTTPS)</h4>
           </div>
           <CodeViewer code={httpExample} explanation="Este código implementa la conexión segura SSL/TLS (necesaria para dominios HTTPS), lee un sensor simulado y gestiona la reconexión automática en caso de fallo de red." />
        </div>
      </div>
    </div>
  );
};

export default Documentation;
