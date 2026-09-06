import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Briefcase, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { store } from '@/lib/store';

export default function EmpleadoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const empleado = store.getEmpleados().find(e => e.id === id);

  if (!empleado) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Empleado no encontrado</p>
        <Button variant="link" onClick={() => navigate('/empleados')}>Volver al directorio</Button>
      </div>
    );
  }

  const initials = `${empleado.nombre[0]}${empleado.apellidos[0]}`.toUpperCase();
  const ausencias = store.getAusencias().filter(a => a.empleadoId === empleado.id);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/empleados')} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{empleado.nombre} {empleado.apellidos}</h1>
          <p className="text-muted-foreground">{empleado.puesto || 'Sin puesto'} — {empleado.departamento || 'Sin departamento'}</p>
          <div className="flex gap-2 mt-2">
            <Badge>{empleado.tipoContrato}</Badge>
            <Badge variant="outline">Alta: {empleado.fechaAlta}</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Datos personales</TabsTrigger>
          <TabsTrigger value="laboral">Datos laborales</TabsTrigger>
          <TabsTrigger value="ausencias">Ausencias</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
              <InfoItem icon={Mail} label="Email" value={empleado.email} />
              <InfoItem icon={Phone} label="Teléfono" value={empleado.telefono || '—'} />
              <InfoItem icon={Calendar} label="DNI/NIE" value={empleado.dni || '—'} />
              <InfoItem icon={Calendar} label="Fecha nacimiento" value={empleado.fechaNacimiento || '—'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laboral">
          <Card>
            <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
              <InfoItem icon={Building} label="Departamento" value={empleado.departamento || '—'} />
              <InfoItem icon={Briefcase} label="Puesto" value={empleado.puesto || '—'} />
              <InfoItem icon={Calendar} label="Fecha alta" value={empleado.fechaAlta} />
              <InfoItem icon={Calendar} label="Nº Seg. Social" value={empleado.numeroSS || '—'} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ausencias">
          <Card>
            <CardContent className="pt-6">
              {ausencias.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Sin ausencias registradas</p>
              ) : (
                <div className="space-y-3">
                  {ausencias.map(a => (
                    <div key={a.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium capitalize">{a.tipo.replace('_', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{a.fechaInicio} → {a.fechaFin}</p>
                      </div>
                      <Badge variant={a.estado === 'aprobada' ? 'default' : a.estado === 'rechazada' ? 'destructive' : 'secondary'}>
                        {a.estado}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
