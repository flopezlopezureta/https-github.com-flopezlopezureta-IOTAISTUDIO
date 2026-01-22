
import { HardwareType, NetworkMode, ProtocolType } from "../types";

// Definición de las capacidades de cada placa
interface HardwareProfile {
  id: HardwareType;
  name: string;
  description: string;
  supportedNetworks: NetworkMode[];
  supportedProtocols: ProtocolType[];
  requiresSim: boolean;
  requiresWifi: boolean;
  pinoutInfo?: string;
}

export const HARDWARE_CATALOG: Record<string, HardwareProfile> = {
  [HardwareType.T_SIM7080_S3]: {
    id: HardwareType.T_SIM7080_S3,
    name: "LilyGO T-SIM7080-S3",
    description: "Placa industrial con módem LTE Cat-M1/NB-IoT y soporte de batería.",
    supportedNetworks: [NetworkMode.CAT_M1, NetworkMode.NB_IOT, NetworkMode.AUTO],
    supportedProtocols: [ProtocolType.HTTP_POST, ProtocolType.MQTT, ProtocolType.MQTTS],
    requiresSim: true,
    requiresWifi: false
  },
  [HardwareType.WALTER_ESP32_S3]: {
    id: HardwareType.WALTER_ESP32_S3,
    name: "Walter ESP32-S3 IoT",
    description: "Módulo certificado con GNSS integrado y conectividad celular 5G-Ready.",
    supportedNetworks: [NetworkMode.CAT_M1, NetworkMode.NB_IOT],
    supportedProtocols: [ProtocolType.HTTP_POST, ProtocolType.MQTT, ProtocolType.COAP],
    requiresSim: true,
    requiresWifi: false
  },
  [HardwareType.ESP32_GENERIC]: {
    id: HardwareType.ESP32_GENERIC,
    name: "ESP32 DevKit V1 / S3",
    description: "Microcontrolador estándar para soluciones WiFi de bajo costo.",
    supportedNetworks: [NetworkMode.WIFI],
    supportedProtocols: [ProtocolType.HTTP_POST, ProtocolType.MQTT],
    requiresSim: false,
    requiresWifi: true
  },
  [HardwareType.ESP32_C6]: {
    id: HardwareType.ESP32_C6,
    name: "ESP32-C6 (WiFi 6)",
    description: "Nueva generación con WiFi 6 y bajo consumo de energía.",
    supportedNetworks: [NetworkMode.WIFI],
    supportedProtocols: [ProtocolType.HTTP_POST, ProtocolType.MQTT, ProtocolType.MQTTS],
    requiresSim: false,
    requiresWifi: true
  }
};
