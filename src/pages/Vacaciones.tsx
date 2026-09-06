import { useState } from 'react';
import { CalendarDays, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { store } from '@/lib/store';
import { SolicitudAusencia } from '@/types/hr';

const tiposAusencia = [
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'baja_medica', label: 'Baja médica' },
  { value: 'permiso_personal', label: 'Permiso personal' },
  { value: 'asuntos_propios', label: 'Asuntos propios' },
  { value: 'maternidad', label: 'Maternidad' },
  { value: 'paternidad', label: 'Paternidad' },
  { value: 'otro', label: 'Otro' },
];

export default function Vacaciones() {
  const [ausencias, setAusencias] = useState(store.getAusencias());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo: 'vacaciones' as SolicitudAusencia['tipo'], fechaInicio: '', fechaFin: '', comentario: '' });

  const diasDisponibles = 22;
  const diasUsados = ausencias.filter(a => a.tipo === 'vacaciones' && a.estado !== 'rechazada').reduce((acc, a) => {
    const d1 = new Date(a.fechaInicio); const d2 = new Date(a.fechaFin);
    return acc + Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1;
  }, 0);

  const submit = () => {
    if (!form.fechaInicio || !form.fechaFin) return;
    const nueva: SolicitudAusencia = {
      id: crypto.randomUUID(), empleadoId: 'admin', ...form,
      estado: 'pendiente', fechaSolicitud: new Date().toISOString().split('T')[0],
    };
    const updated = [...ausencias, nueva];
    setAusencias(updated); store.setAusencias(updated); setOpen(false);
    setForm({ tipo: 'vacaciones', fechaInicio: '', fechaFin: '', comentario: '' });
  };

  const cambiarEstado = (id: string, estado: SolicitudAusencia['estado']) => {
    const updated = ausencias.map(a => a.id === id ? { ...a, estado } : a);
    setAusencias(updated); store.setAusencias(updated);
  };

  const estadoIcon = (e: string) => {
    if (e === 'aprobada') return <CheckCircle className="h-4 w-4 text-success" />;
    if (e === 'rechazada') return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vacaciones y Ausencias</h1>
          <p className="text-muted-foreground">Gestión de solicitudes y calendario</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Solicitar ausencia</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva solicitud de ausencia</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v as SolicitudAusencia['tipo'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tiposAusencia.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Desde</Label><Input type="date" value={form.fechaInicio} onChange={e => setForm({ ...form, fechaInicio: e.target.value })} /></div>
                <div><Label>Hasta</Label><Input type="date" value={form.fechaFin} onChange={e => setForm({ ...form, fechaFin: e.target.value })} /></div>
              </div>
              <div><Label>Comentario</Label><Textarea value={form.comentario} onChange={e => setForm({ ...form, comentario: e.target.value })} placeholder="Opcional" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={submit}>Enviar solicitud</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Días disponibles</p>
            <p className="text-4xl font-bold text-primary mt-1">{diasDisponibles - diasUsados}</p>
            <p className="text-xs text-muted-foreground mt-1">de {diasDisponibles} días anuales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Días usados</p>
            <p className="text-4xl font-bold mt-1">{diasUsados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Solicitudes pendientes</p>
            <p className="text-4xl font-bold text-warning mt-1">{ausencias.filter(a => a.estado === 'pendiente').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Solicitudes</CardTitle></CardHeader>
        <CardContent>
          {ausencias.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <CalendarDays className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No hay solicitudes de ausencia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ausencias.sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud)).map(a => (
                <div key={a.id} className="flex items-center justify-between border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {estadoIcon(a.estado)}
                    <div>
                      <p className="font-medium capitalize">{a.tipo.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">{a.fechaInicio} → {a.fechaFin}</p>
                      {a.comentario && <p className="text-xs text-muted-foreground mt-1">{a.comentario}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.estado === 'aprobada' ? 'default' : a.estado === 'rechazada' ? 'destructive' : 'secondary'}>
                      {a.estado}
                    </Badge>
                    {a.estado === 'pendiente' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => cambiarEstado(a.id, 'aprobada')} className="text-success"><CheckCircle className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => cambiarEstado(a.id, 'rechazada')} className="text-destructive"><XCircle className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
