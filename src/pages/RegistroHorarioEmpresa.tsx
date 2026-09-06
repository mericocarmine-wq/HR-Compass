import { useState, useMemo } from 'react';
import { Clock, Download, FileText, Users, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { useRole } from '@/hooks/useRole';

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(now);
  start.setDate(diff);
  return start.toISOString().split('T')[0];
}

function getMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function formatDate(fecha: string) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export default function RegistroHorarioEmpresa() {
  const empleados = store.getEmpleados();
  const registros = store.getRegistros();
  const { canManage } = useRole();
  const [filtro, setFiltro] = useState<'semana' | 'mes' | 'todo'>('semana');
  const [busqueda, setBusqueda] = useState('');
  const [empleadoFiltro, setEmpleadoFiltro] = useState<string>('todos');

  const empleadoMap = useMemo(() => {
    const map = new Map<string, string>();
    empleados.forEach(e => map.set(e.id, `${e.nombre} ${e.apellidos}`));
    return map;
  }, [empleados]);

  const filtered = useMemo(() => {
    const weekStart = getWeekRange();
    const monthStart = getMonthStart();

    return registros
      .filter(r => {
        if (filtro === 'semana') return r.fecha >= weekStart;
        if (filtro === 'mes') return r.fecha >= monthStart;
        return true;
      })
      .filter(r => empleadoFiltro === 'todos' || r.empleadoId === empleadoFiltro)
      .filter(r => {
        if (!busqueda) return true;
        const nombre = empleadoMap.get(r.empleadoId) || r.empleadoId;
        return nombre.toLowerCase().includes(busqueda.toLowerCase());
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || (empleadoMap.get(a.empleadoId) || '').localeCompare(empleadoMap.get(b.empleadoId) || ''));
  }, [registros, filtro, empleadoFiltro, busqueda, empleadoMap]);

  const totalHoras = useMemo(() =>
    filtered.reduce((sum, r) => sum + (r.horasTotales || 0), 0), [filtered]
  );

  const exportCSV = () => {
    const header = 'Empleado,Fecha,Entrada,Salida,Horas,Dispositivo\n';
    const rows = filtered.map(r => {
      const nombre = empleadoMap.get(r.empleadoId) || r.empleadoId;
      return `"${nombre}",${r.fecha},${r.horaEntrada},${r.horaSalida || 'En curso'},${r.horasTotales ?? ''},${r.dispositivo}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registro-horario-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const rows = filtered.map(r => {
      const nombre = empleadoMap.get(r.empleadoId) || r.empleadoId;
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${nombre}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${formatDate(r.fecha)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${r.horaEntrada}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0">${r.horaSalida || '<em>En curso</em>'}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e2e8f0;text-align:right">${r.horasTotales != null ? r.horasTotales.toFixed(1) + 'h' : '—'}</td>
      </tr>`;
    }).join('');

    win.document.write(`<!DOCTYPE html><html><head><title>Registro Horario</title>
      <style>
        body{font-family:Inter,system-ui,sans-serif;margin:40px;color:#1e293b}
        h1{font-size:20px;margin-bottom:4px}
        .meta{color:#64748b;font-size:13px;margin-bottom:24px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{text-align:left;padding:8px 10px;background:#f1f5f9;border-bottom:2px solid #cbd5e1;font-weight:600}
        .footer{margin-top:32px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
        .summary{display:flex;gap:32px;margin-bottom:20px;font-size:13px}
        .summary strong{font-size:18px;display:block}
      </style>
    </head><body>
      <h1>Registro Horario de Empresa</h1>
      <p class="meta">Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} — Cumplimiento RD-ley 8/2019</p>
      <div class="summary">
        <div><strong>${filtered.length}</strong>Registros</div>
        <div><strong>${totalHoras.toFixed(1)}h</strong>Horas totales</div>
        <div><strong>${new Set(filtered.map(r => r.empleadoId)).size}</strong>Empleados</div>
      </div>
      <table>
        <thead><tr><th>Empleado</th><th>Fecha</th><th>Entrada</th><th>Salida</th><th style="text-align:right">Horas</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">
        <p>Documento generado automáticamente por Axontia RRHH. Registro conforme al artículo 34.9 del Estatuto de los Trabajadores (RD-ley 8/2019).</p>
        <p>Este registro debe conservarse durante cuatro años y permanecer a disposición de las personas trabajadoras, representantes legales y la ITSS.</p>
      </div>
      <script>window.onload=()=>{window.print()}</script>
    </body></html>`);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro Horario Empresa</h1>
          <p className="text-muted-foreground">Control horario de todos los empleados — RD-ley 8/2019</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={exportCSV}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportPDF}>
              <FileText className="h-4 w-4" /> PDF
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3"><Clock className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total horas</p>
              <p className="text-2xl font-bold">{totalHoras.toFixed(1)}h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3"><FileText className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Registros</p>
              <p className="text-2xl font-bold">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Empleados</p>
              <p className="text-2xl font-bold">{new Set(filtered.map(r => r.empleadoId)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Registros de fichaje</CardTitle>
            <CardDescription>Vista consolidada de todos los empleados</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar empleado…" className="pl-9 w-48" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <Select value={empleadoFiltro} onValueChange={setEmpleadoFiltro}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los empleados</SelectItem>
                {empleados.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nombre} {e.apellidos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtro} onValueChange={v => setFiltro(v as typeof filtro)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mes</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Clock className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Sin registros en este periodo</p>
              <p className="text-xs">Los fichajes de los empleados aparecerán aquí</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead>Dispositivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{empleadoMap.get(r.empleadoId) || r.empleadoId}</TableCell>
                    <TableCell>{formatDate(r.fecha)}</TableCell>
                    <TableCell>{r.horaEntrada}</TableCell>
                    <TableCell>
                      {r.horaSalida || <Badge variant="secondary">En curso</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.horasTotales != null ? (
                        <span className={r.horasTotales > 9 ? 'text-destructive font-medium' : ''}>
                          {r.horasTotales.toFixed(1)}h
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell><Badge variant="outline">{r.dispositivo}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
