import type { RegistroJornada } from '@/types/hr';

export type Severidad = 'CRITICA' | 'ALTA' | 'MEDIA';
export type TipoInfraccion = 'exceso_jornada' | 'fichaje_incompleto' | 'descanso_insuficiente';

export interface Infraccion {
  id: string;
  tipo: TipoInfraccion;
  severidad: Severidad;
  empleadoId: string;
  fecha: string;
  descripcion: string;
  referenciaLegal: string;
  multaMin: number;
  multaMax: number;
}

export interface ComplianceResult {
  score: number;
  infracciones: Infraccion[];
  exposicionTotal: number;
  totalCriticas: number;
  totalAltas: number;
  totalMedias: number;
  porTipo: Record<string, number>;
}

export interface CompliancePolicy {
  maxOrdinaryDailyHours: number;
  minRestHours: number;
}

export const DEFAULT_COMPLIANCE_POLICY: CompliancePolicy = {
  maxOrdinaryDailyHours: 9,
  minRestHours: 12,
};

// LISOS art. 40.1.b. Los incumplimientos de jornada del art. 7.5 son graves.
const GRAVE_PENALTY = { min: 751, max: 7_500 } as const;

function toLocalTimestamp(fecha: string, hora: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(hora);
  if (!dateMatch || !timeMatch) return null;
  const [, year, month, day] = dateMatch;
  const [, hours, minutes, seconds = '0'] = timeMatch;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function stableId(registroId: string, tipo: TipoInfraccion): string {
  return `${tipo}:${registroId}`;
}

export function analizarCumplimiento(
  registros: RegistroJornada[],
  options: { today?: string; policy?: CompliancePolicy } = {},
): ComplianceResult {
  const infracciones: Infraccion[] = [];
  const hoy = options.today ?? new Date().toLocaleDateString('sv-SE');
  const policy = options.policy ?? DEFAULT_COMPLIANCE_POLICY;
  const porEmpleado = new Map<string, RegistroJornada[]>();

  for (const registro of registros) {
    const registrosEmpleado = porEmpleado.get(registro.empleadoId) ?? [];
    registrosEmpleado.push(registro);
    porEmpleado.set(registro.empleadoId, registrosEmpleado);
  }

  for (const [empleadoId, registrosEmpleado] of porEmpleado) {
    const sorted = [...registrosEmpleado].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaEntrada.localeCompare(b.horaEntrada));

    for (const registro of sorted) {
      if (!registro.horaSalida && registro.fecha !== hoy) {
        infracciones.push({
          id: stableId(registro.id, 'fichaje_incompleto'), tipo: 'fichaje_incompleto', severidad: 'CRITICA', empleadoId,
          fecha: registro.fecha, descripcion: `Fichaje sin hora de salida registrada el ${registro.fecha}`,
          referenciaLegal: 'ET art. 34.9 y LISOS art. 7.5 — registro diario de inicio y fin',
          multaMin: GRAVE_PENALTY.min, multaMax: GRAVE_PENALTY.max,
        });
      }

      if (registro.horasTotales != null && registro.horasTotales > policy.maxOrdinaryDailyHours) {
        infracciones.push({
          id: stableId(registro.id, 'exceso_jornada'), tipo: 'exceso_jornada', severidad: 'ALTA', empleadoId,
          fecha: registro.fecha,
          descripcion: `Jornada de ${registro.horasTotales.toFixed(1)}h (umbral: ${policy.maxOrdinaryDailyHours}h) el ${registro.fecha}`,
          referenciaLegal: 'ET art. 34.3 y LISOS art. 7.5 — jornada ordinaria diaria (salvo distribución aplicable)',
          multaMin: GRAVE_PENALTY.min, multaMax: GRAVE_PENALTY.max,
        });
      }
    }

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (!previous.horaSalida || !current.horaEntrada || previous.fecha === current.fecha) continue;
      const end = toLocalTimestamp(previous.fecha, previous.horaSalida);
      const start = toLocalTimestamp(current.fecha, current.horaEntrada);
      if (end == null || start == null || start <= end) continue;
      const restHours = (start - end) / 3_600_000;
      if (restHours < policy.minRestHours) {
        infracciones.push({
          id: stableId(`${previous.id}:${current.id}`, 'descanso_insuficiente'), tipo: 'descanso_insuficiente', severidad: 'CRITICA', empleadoId,
          fecha: current.fecha, descripcion: `Solo ${restHours.toFixed(1)}h de descanso entre jornadas (mín. ${policy.minRestHours}h)`,
          referenciaLegal: 'ET art. 34.3 y LISOS art. 7.5 — descanso entre jornadas',
          multaMin: GRAVE_PENALTY.min, multaMax: GRAVE_PENALTY.max,
        });
      }
    }
  }

  const totals = infracciones.reduce((summary, infringement) => {
    summary.score -= infringement.severidad === 'CRITICA' ? 7 : 2;
    summary[infringement.severidad] += 1;
    summary.porTipo[infringement.tipo] = (summary.porTipo[infringement.tipo] ?? 0) + 1;
    summary.exposicionTotal += infringement.multaMax;
    return summary;
  }, { score: 100, CRITICA: 0, ALTA: 0, MEDIA: 0, porTipo: {} as Record<string, number>, exposicionTotal: 0 });

  return {
    score: Math.max(0, totals.score), infracciones, exposicionTotal: totals.exposicionTotal,
    totalCriticas: totals.CRITICA, totalAltas: totals.ALTA, totalMedias: totals.MEDIA, porTipo: totals.porTipo,
  };
}
