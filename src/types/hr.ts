export interface Empleado {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  departamento: string;
  puesto: string;
  fechaAlta: string;
  tipoContrato: 'indefinido' | 'temporal' | 'practicas' | 'formacion';
  salarioBruto?: number;
  avatar?: string;
  fechaNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  iban?: string;
  numeroSS?: string;
  centroTrabajo?: string;
}

export interface RegistroJornada {
  id: string;
  empleadoId: string;
  fecha: string;
  horaEntrada: string;
  horaSalida: string | null;
  pausas: Pausa[];
  horasTotales: number | null;
  dispositivo: string;
}

export interface Pausa {
  inicio: string;
  fin: string | null;
}

export interface SolicitudAusencia {
  id: string;
  empleadoId: string;
  tipo: 'vacaciones' | 'baja_medica' | 'permiso_personal' | 'asuntos_propios' | 'maternidad' | 'paternidad' | 'otro';
  fechaInicio: string;
  fechaFin: string;
  comentario: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: string;
}

export interface Nomina {
  id: string;
  empleadoId: string;
  mes: string;
  año: number;
  importeBruto: number;
  importeNeto: number;
  irpf: number;
  seguridadSocial: number;
  estado: 'pendiente' | 'procesada' | 'pagada';
}

export interface Documento {
  id: string;
  nombre: string;
  categoria: 'contratos' | 'nominas' | 'certificados' | 'otros';
  empleadoId?: string;
  fechaSubida: string;
  tamaño: string;
  tipo: string;
}
