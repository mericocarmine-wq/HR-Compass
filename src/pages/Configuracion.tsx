import { useState } from 'react';
import { Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useCompany } from '@/hooks/useCompany';
import { supabase } from '@/integrations/supabase/client';

export default function Configuracion() {
  const { company, members } = useCompany();
  const [name, setName] = useState(company?.name || '');
  const [sector, setSector] = useState(company?.sector || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    await supabase.from('companies').update({ name, sector }).eq('id', company.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const roleCount = (role: string) => members.filter(m => m.role === role).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Ajustes de la plataforma</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="roles">Roles y permisos</TabsTrigger>
          <TabsTrigger value="integraciones">Integraciones</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Datos de la empresa</CardTitle>
              <CardDescription>Información general de tu organización</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 max-w-lg">
              <div><Label>Nombre de la empresa</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Sector</Label><Input value={sector} onChange={e => setSector(e.target.value)} /></div>
              <Button className="w-fit" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>Roles y permisos</CardTitle>
              <CardDescription>Gestiona los roles de acceso a la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { rol: 'Owner', key: 'owner', desc: 'Acceso total al sistema' },
                  { rol: 'Admin', key: 'admin', desc: 'Gestión de empleados, nóminas y ausencias' },
                  { rol: 'Manager', key: 'manager', desc: 'Aprobación de ausencias de su equipo' },
                  { rol: 'Empleado', key: 'empleado', desc: 'Autoservicio: fichaje, solicitudes, documentos' },
                ].map(r => (
                  <div key={r.rol} className="flex items-center justify-between border rounded-lg p-4">
                    <div>
                      <p className="font-medium">{r.rol}</p>
                      <p className="text-sm text-muted-foreground">{r.desc}</p>
                    </div>
                    <Badge variant="outline">{roleCount(r.key)} usuario{roleCount(r.key) !== 1 ? 's' : ''}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integraciones">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones</CardTitle>
              <CardDescription>Conecta con herramientas externas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Slack', desc: 'Notificaciones en canales', connected: false },
                  { name: 'Google Workspace', desc: 'Sincronización de calendario', connected: false },
                  { name: 'Gestoría (A3/Sage)', desc: 'Intercambio de datos de nóminas', connected: false },
                  { name: 'API REST', desc: 'Acceso programático', connected: true },
                ].map(i => (
                  <div key={i.name} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Plug className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{i.name}</p>
                        <p className="text-sm text-muted-foreground">{i.desc}</p>
                      </div>
                    </div>
                    <Button variant={i.connected ? 'outline' : 'default'} size="sm">
                      {i.connected ? 'Configurar' : 'Conectar'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {[
                'Nuevas solicitudes de ausencia',
                'Fichajes irregulares',
                'Documentos por vencer',
                'Nóminas procesadas',
                'Cumpleaños del equipo',
              ].map(n => (
                <div key={n} className="flex items-center justify-between">
                  <Label>{n}</Label>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
