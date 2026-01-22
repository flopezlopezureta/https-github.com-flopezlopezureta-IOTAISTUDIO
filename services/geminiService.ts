
import { GoogleGenAI, Type } from "@google/genai";
import { SensorType, ProtocolType, NetworkMode, HardwareType, SIMProvider, MqttConfig, HttpConfig } from "../types";

// Declaración para satisfacer a TypeScript sin instalar @types/node.
// IMPORTANTE: Vite reemplazará la cadena 'process.env.API_KEY' literal durante el build.
declare const process: { env: { API_KEY: string } };

export const generateIoTCode = async (
  hardware: HardwareType,
  sensor: SensorType, 
  protocol: ProtocolType, 
  networkMode: NetworkMode,
  commConfig: HttpConfig | MqttConfig,
  simProvider?: SIMProvider,
  wifiConfig?: { ssid: string, pass: string }
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const apnMap: Record<string, string> = {
    [SIMProvider.ENTEL]: "entel.tst",
    [SIMProvider.MOVISTAR]: "m2m.movistar.cl",
    [SIMProvider.CLARO]: "m2m.claro.cl",
    [SIMProvider.WOM]: "internet",
    [SIMProvider.GLOBAL_SIM]: "iot.global",
    [SIMProvider.OTHER]: "tu_apn_aqui"
  };

  const isCellular = networkMode !== NetworkMode.WIFI;
  const selectedApn = simProvider ? apnMap[simProvider] : "internet";
  
  // Construcción del detalle de protocolo
  let protocolDetails = "";
  if (protocol.includes("MQTT")) {
     const mqtt = commConfig as MqttConfig;
     protocolDetails = `
       PROTOCOLO: MQTT
       BROKER: ${mqtt.broker}
       PORT: ${mqtt.port}
       USER: ${mqtt.username || "N/A"}
       PASS: ${mqtt.password || "N/A"}
       TOPIC PUB: ${mqtt.topicPub}
     `;
  } else {
     const http = commConfig as HttpConfig;
     protocolDetails = `
       PROTOCOLO: HTTP REST
       ENDPOINT: ${http.endpoint}
       METHOD: ${http.method}
     `;
  }

  // Instrucción de sistema
  const systemInstruction = `Eres un experto ingeniero embebido Senior. Genera código C++ (Arduino/PlatformIO) robusto y listo para producción.
    
    REGLAS DE HARDWARE:
    - T-SIM7080-S3: Usa librería TinyGSM obligatoriamente. Define pines: TX=18, RX=17, PWR=41, BAT_ADC=4.
    - ESP32 Genérico/S3 (WiFi): Usa <WiFi.h> y <PubSubClient.h> (si es MQTT) o <HTTPClient.h>.
    
    REGLAS DE CONEXIÓN:
    - Si es MQTT: Implementa reconexión automática en loop().
    - Si es Celular: Implementa espera de red y APN correcto.
    
    SALIDA:
    - JSON estricto con campos "code" (string con el código completo) y "explanation" (resumen técnico).
  `;

  const prompt = `
    Genera un sketch de Arduino (.ino) completo para:
    HARDWARE: ${hardware}
    SENSOR: ${sensor} (Simula la lectura si no hay librería específica, ej: random o lectura analógica)
    RED: ${networkMode}
    ${isCellular ? `APN: ${selectedApn}` : `WIFI SSID: ${wifiConfig?.ssid}, PASS: ${wifiConfig?.pass}`}
    ${protocolDetails}
    
    El código debe ser compilable y tener comentarios explicativos.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["code", "explanation"]
      }
    }
  });

  const jsonStr = response.text?.trim() || "{}";
  return JSON.parse(jsonStr);
};
