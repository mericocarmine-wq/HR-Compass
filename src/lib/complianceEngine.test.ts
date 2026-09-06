import { describe, expect, it } from 'vitest';
import type { RegistroJornada } from '@/types/hr';
import { analizarCumplimiento } from './complianceEngine';

const registro = (overrides: Partial<RegistroJornada>): RegistroJornada => ({
  id: 'registro-1', empleadoId: 'empleado-1', fecha: '2026-08-01',
  horaEntrada: '09:00', horaSalida: '18:00', pausas: [], horasTotales: 8,
  dispositivo: 'web', ...overrides,
});

describe('analizarCumplimiento', () => {
  it('detecta fichajes incompletos pasados con identificadores deterministas', () => {
    const input = [registro({ horaSalida: null, horasTotales: null })];
    const first = analizarCumplimiento(input, { today: '2026-08-02' });
    const second = analizarCumplimiento(input, { today: '2026-08-02' });
    expect(first.infracciones).toHaveLength(1);
    expect(first.infracciones[0].id).toBe(second.infracciones[0].id);
    expect(first.infracciones[0]).toMatchObject({ multaMin: 751, multaMax: 7_500 });
  });

  it('no marca como incompleto el fichaje abierto de hoy', () => {
    const result = analizarCumplimiento(
      [registro({ horaSalida: null, horasTotales: null })],
      { today: '2026-08-01' },
    );
    expect(result.infracciones).toHaveLength(0);
  });

  it('detecta exceso diario y descanso inferior a doce horas', () => {
    const result = analizarCumplimiento([
      registro({ id: 'a', horasTotales: 10, horaSalida: '23:00' }),
      registro({ id: 'b', fecha: '2026-08-02', horaEntrada: '08:00', horaSalida: '16:00' }),
    ], { today: '2026-08-03' });
    expect(result.porTipo).toEqual({ exceso_jornada: 1, descanso_insuficiente: 1 });
    expect(result.exposicionTotal).toBe(15_000);
    expect(result.score).toBe(91);
  });

  it('permite ajustar el umbral diario según el convenio aplicable', () => {
    const result = analizarCumplimiento(
      [registro({ horasTotales: 9.5 })],
      { today: '2026-08-02', policy: { maxOrdinaryDailyHours: 10, minRestHours: 12 } },
    );
    expect(result.infracciones).toHaveLength(0);
  });
});
