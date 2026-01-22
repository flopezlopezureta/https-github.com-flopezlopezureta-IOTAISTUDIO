
import { Company, User, Device, HardwareType, SensorType, ProtocolType, NetworkMode, SIMProvider } from '../types';

const STORAGE_KEYS = {
  COMPANIES: 'selcom_companies',
  USERS: 'selcom_users',
  DEVICES: 'selcom_devices'
};

const API_URL = '/api.php'; // Ruta relativa en el servidor regentry.cl

const INITIAL_DATA = {
  companies: [
    {
      id: 'SELCOM-CORP',
      name: 'Selcom Industrial Solutions',
      tax_id: '76.123.456-K',
      service_status: 'active' as const,
      active: true
    }
  ],
  users: [
    {
      id: 'u1',
      username: 'admin',
      password: '.Dan15223.',
      full_name: 'Administrador Sistema',
      role: 'admin' as const,
      active: true
    }
  ],
  devices: [
    {
      id: 'd1',
      name: 'Tanque S3 LTE',
      mac_address: '7C:9E:BD:ED:32:01',
      type: SensorType.LEVEL,
      unit: 'm',
      status: 'online' as const,
      value: 12.5,
      progress: 65,
      company_id: 'SELCOM-CORP',
      hardwareConfig: {
        hardware: HardwareType.T_SIM7080_S3,
        sensor: SensorType.LEVEL,
        protocol: ProtocolType.HTTP_POST,
        networkMode: NetworkMode.CAT_M1,
        simProvider: SIMProvider.ENTEL,
        endpoint: 'https://regentry.cl/api/iot_backend.php',
        interval: 10
      }
    }
  ]
};

const getLocal = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  try {
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const databaseService = {
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      saveLocal(STORAGE_KEYS.COMPANIES, INITIAL_DATA.companies);
      saveLocal(STORAGE_KEYS.USERS, INITIAL_DATA.users);
      saveLocal(STORAGE_KEYS.DEVICES, INITIAL_DATA.devices);
    }
  },

  // Mock de sincronización: En el futuro, estos métodos podrían ser async y llamar a fetch(API_URL)
  getCompanies: (): Company[] => getLocal(STORAGE_KEYS.COMPANIES, []),
  
  // Implementación de gestión de empresas
  addCompany: (company: Omit<Company, 'id'>) => {
    const companies = getLocal<Company[]>(STORAGE_KEYS.COMPANIES, []);
    const newCompany: Company = {
      ...company,
      id: `COM-${Date.now()}`
    };
    saveLocal(STORAGE_KEYS.COMPANIES, [...companies, newCompany]);
    return newCompany;
  },

  updateCompany: (id: string, updates: Partial<Company>) => {
    const companies = getLocal<Company[]>(STORAGE_KEYS.COMPANIES, []).map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    saveLocal(STORAGE_KEYS.COMPANIES, companies);
  },

  deleteCompany: (id: string) => {
    const companies = getLocal<Company[]>(STORAGE_KEYS.COMPANIES, []).filter(c => c.id !== id);
    saveLocal(STORAGE_KEYS.COMPANIES, companies);
  },

  getDevices: (user?: User): Device[] => {
    const all = getLocal(STORAGE_KEYS.DEVICES, []);
    if (!user || user.role === 'admin') return all;
    return all.filter(d => d.company_id === user.company_id);
  },

  // Para el historial, podríamos intentar leer de la API real
  getRealHistory: async (mac: string) => {
    try {
        const res = await fetch(`${API_URL}?action=get_history&mac=${mac}`);
        if (res.ok) return await res.json();
    } catch (e) {
        return [];
    }
  },

  addDevice: (device: Omit<Device, 'id' | 'value' | 'progress' | 'status'>) => {
    const devices = getLocal<Device[]>(STORAGE_KEYS.DEVICES, []);
    const newDevice: Device = {
      ...device,
      id: `DEV-${Date.now()}`,
      value: 0,
      progress: 0,
      status: 'offline'
    };
    saveLocal(STORAGE_KEYS.DEVICES, [...devices, newDevice]);
    return newDevice;
  },

  updateDevice: (id: string, updates: Partial<Device>) => {
    const devices = getLocal<Device[]>(STORAGE_KEYS.DEVICES, []).map(d => 
      d.id === id ? { ...d, ...updates } : d
    );
    saveLocal(STORAGE_KEYS.DEVICES, devices);
  },

  deleteDevice: (id: string) => {
    const devices = getLocal<Device[]>(STORAGE_KEYS.DEVICES, []).filter(d => d.id !== id);
    saveLocal(STORAGE_KEYS.DEVICES, devices);
  },

  getUsers: (companyId?: string): User[] => {
    const all = getLocal(STORAGE_KEYS.USERS, []);
    if (companyId) return all.filter(u => u.company_id === companyId);
    return all;
  },

  addUser: (user: Omit<User, 'id'>) => {
    const users = databaseService.getUsers();
    const newUser = { ...user, id: `USR-${Date.now()}` };
    saveLocal(STORAGE_KEYS.USERS, [...users, newUser]);
    return newUser;
  },

  updateUser: (id: string, updates: Partial<User>) => {
    const users = databaseService.getUsers().map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    saveLocal(STORAGE_KEYS.USERS, users);
  },

  deleteUser: (id: string) => {
    const users = databaseService.getUsers().filter(u => u.id !== id);
    saveLocal(STORAGE_KEYS.USERS, users);
  },

  login: (username: string, pass: string): User | null => {
    const users = databaseService.getUsers();
    const user = users.find(u => u.username === username && u.password === pass);
    return user || null;
  }
};
