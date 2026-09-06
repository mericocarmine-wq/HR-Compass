import { useState, useEffect } from 'react';
import { Clock, Play, Square, Coffee, Shield, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { store } from '@/lib/store';
import { RegistroJornada } from '@/types/hr';

export default function Jornada() {
  const [registros, setRegistros] = useState(store.getRegistros());
  const [now, setNow] = useState(new Date());
  const [filtro, setFiltro] = useState<'hoy' | 'semana' | 'mes'>('hoy');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const registroHoy = registros.find(r => r.fecha === today && !r.horaSalida);
  const isFichado = !!registroHoy;

  const fichar = () => {
    const updated = [...registros];
    if (isFichado && registroHoy) {
      const idx = updated.findIndex(r => r.id === registroHoy.id);
      const entrada = new Date(`${today}T${registroHoy.horaEntrada}`);
      const salida = now;
      const horas = (salida.getTime() - entrada.getTime()) / 3600000;
      updated[idx] = { ...registroHoy, horaSalida: now.toTimeString().slice(0, 8), horasTotales: Math.round(horas * 100) / 100 };
    } else {
      updated.push({
        id: crypto.randomUUID(),
        empleadoId: 'admin',
        fecha: today,
        horaEntrada: now.toTimeString().slice(0, 8),
        horaSalida: null,
        pausas: [],
        horasTotales: null,
        dispositivo: 'Web',
      });
    }
    setRegistros(updated);
    store.setRegistros(updated);
  };

  const filteredRegistros = registros.filter(r => {
    if (filtro === 'hoy') return r.fecha === today;
    if (filtro === 'semana') {
      const d = new Date(r.fecha);
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return diff <= 7;
    }
    return true;
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registro de Jornada</h1>
          <p className="text-muted-foreground">Control horario — RD-ley 8/2019</p>
        </div>
        <Badge variant="outline" className="gap-1 border-success text-success">
          <Shield className="h-3 w-3" /> Cumplimiento RD 8/2019
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-5xl font-mono font-bold tabular-nums">
              {now.toLocaleTimeString('es-ES')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <Button
              size="lg"
              className={`mt-6 gap-2 w-full max-w-xs ${isFichado ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              onClick={fichar}
            >
              {isFichado ? <><Square className="h-5 w-5" /> Fichar salida</> : <><Play className="h-5 w-5" /> Fichar entrada</>}
            </Button>
            {isFichado && registroHoy && (
              <p className="text-sm text-muted-foreground mt-3">
                Entrada registrada a las <span className="font-medium text-foreground">{registroHoy.horaEntrada}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Registros</CardTitle>
              <CardDescription>{filteredRegistros.length} registro{filteredRegistros.length !== 1 ? 's' : ''}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filtro} onValueChange={v => setFiltro(v as typeof filtro)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mes</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRegistros.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Sin registros en este periodo</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Dispositivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistros.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.fecha}</TableCell>
                      <TableCell>{r.horaEntrada}</TableCell>
                      <TableCell>{r.horaSalida || <Badge variant="secondary">En curso</Badge>}</TableCell>
                      <TableCell>{r.horasTotales != null ? `${r.horasTotales}h` : '—'}</TableCell>
                      <TableCell><Badge variant="outline">{r.dispositivo}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
