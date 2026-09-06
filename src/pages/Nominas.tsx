import { useMemo } from 'react';
import { Receipt, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { store } from '@/lib/store';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';

export default function Nominas() {
  const allNominas = store.getNominas();
  const empleados = store.getEmpleados();
  const { isEmpleado } = useRole();
  const { user } = useAuth();
  const { membership } = useCompany();

  // Filter nominas: empleado only sees their own
  const nominas = useMemo(() => {
    if (!isEmpleado) return allNominas;
    const myEmail = membership?.email || user?.email || '';
    const myEmpleado = empleados.find(e => e.email.toLowerCase() === myEmail.toLowerCase());
    if (myEmpleado) {
      return allNominas.filter(n => n.empleadoId === myEmpleado.id);
    }
    return [];
  }, [allNominas, isEmpleado, membership, user, empleados]);

  const getName = (id: string) => {
    const e = empleados.find(e => e.id === id);
    return e ? `${e.nombre} ${e.apellidos}` : 'Desconocido';
  };

  const estadoBadge = (e: string) => {
    const m: Record<string, 'default' | 'secondary' | 'destructive'> = { pagada: 'default', procesada: 'secondary', pendiente: 'destructive' };
    return <Badge variant={m[e] || 'secondary'}>{e}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nóminas</h1>
        <p className="text-muted-foreground">
          {isEmpleado ? 'Tus nóminas personales' : 'Gestión de nóminas y pagos'}
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Histórico de nóminas</CardTitle>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
        </CardHeader>
        <CardContent>
          {nominas.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No hay nóminas registradas</p>
              <p className="text-sm">Las nóminas aparecerán aquí cuando se procesen</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  {!isEmpleado && <TableHead>Empleado</TableHead>}
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">IRPF</TableHead>
                  <TableHead className="text-right">Seg. Social</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nominas.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.mes} {n.año}</TableCell>
                    {!isEmpleado && <TableCell>{getName(n.empleadoId)}</TableCell>}
                    <TableCell className="text-right">{n.importeBruto.toLocaleString('es-ES')} €</TableCell>
                    <TableCell className="text-right">{n.irpf.toLocaleString('es-ES')} €</TableCell>
                    <TableCell className="text-right">{n.seguridadSocial.toLocaleString('es-ES')} €</TableCell>
                    <TableCell className="text-right font-medium">{n.importeNeto.toLocaleString('es-ES')} €</TableCell>
                    <TableCell>{estadoBadge(n.estado)}</TableCell>
                    <TableCell><Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button></TableCell>
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
