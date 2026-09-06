import { Empleado, RegistroJornada, SolicitudAusencia, Nomina, Documento } from '@/types/hr';

let tenantId: string | null = null;

function tenantKey(key: string): string {
  if (!tenantId) throw new Error('No hay una empresa activa para acceder a los datos de RRHH');
  return `axontia:${tenantId}:${key}`;
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(tenantKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(tenantKey(key), JSON.stringify(data));
}

export const store = {
  setTenant: (companyId: string | null) => { tenantId = companyId; },
  getEmpleados: (): Empleado[] => load('empleados', []),
  setEmpleados: (data: Empleado[]) => save('empleados', data),

  getRegistros: (): RegistroJornada[] => load('registros', []),
  setRegistros: (data: RegistroJornada[]) => save('registros', data),

  getAusencias: (): SolicitudAusencia[] => load('ausencias', []),
  setAusencias: (data: SolicitudAusencia[]) => save('ausencias', data),

  getNominas: (): Nomina[] => load('nominas', []),
  setNominas: (data: Nomina[]) => save('nominas', data),

  getDocumentos: (): Documento[] => load('documentos', []),
  setDocumentos: (data: Documento[]) => save('documentos', data),
};
