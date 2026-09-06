import { useState, useMemo } from 'react';
import { Users, Clock, CalendarDays, Receipt, UserPlus, FileText, Sparkles, TrendingUp, Shield, AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/hooks/useCompany';
import { useRole } from '@/hooks/useRole';
import { InviteModal } from '@/components/InviteModal';
import { store } from '@/lib/store';
import { analizarCumplimiento } from '@/lib/complianceEngine';

export default function Dashboard() {
  const navigate = useNavigate();
  const { canManage } = useRole();

  const compliance = useMemo(() => {
    const registros = store.getRegistros();
    return analizarCumplimiento(registros);
  }, []);

  const scoreColor = compliance.score >= 80 ? 'text-success' : compliance.score >= 50 ? 'text-warning' : 'text-destructive';
  const scoreLabel = compliance.score >= 80 ? 'Excelente' : compliance.score >= 50 ? 'Mejorable' : 'Crítico';
  const { company, members } = useCompany();
  const [inviteOpen, setInviteOpen] = useState(false);

  const employeeCount = members.filter(m => m.role !== 'owner').length;
  const hasEmployees = employeeCount > 0;

  const kpis = [
    { label: 'Miembros del equipo', value: members.length, icon: Users, color: 'text-primary' },
    { label: 'Ausencias hoy', value: 0, icon: CalendarDays, color: 'text-[hsl(var(--warning))]' },
    { label: 'Fichajes hoy', value: 0, icon: Clock, color: 'text-[hsl(var(--success))]' },
    { label: 'Gastos pendientes', value: '0 €', icon: Receipt, color: 'text-destructive' },
  ];

  const quickLinks = [
    ...(canManage ? [{ label: 'Invitar empleado', icon: UserPlus, action: () => setInviteOpen(true) }] : []),
    { label: 'Fichar jornada', icon: Clock, action: () => navigate('/jornada') },
    { label: 'Solicitar ausencia', icon: CalendarDays, action: () => navigate('/vacaciones') },
    { label: 'Ver documentos', icon: FileText, action: () => navigate('/documentos') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a {company?.name || 'Axontia RRHH'}
        </p>
      </div>

      {/* Welcome Widget — only for managers+ when no employees yet */}
      {!hasEmployees && canManage && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold text-foreground mb-1">
                Tu empresa está lista. Vamos a darle vida.
              </h2>
              <p className="text-muted-foreground">
                Invita a tu primer empleado y comienza a gestionar tu equipo desde Axontia RRHH.
              </p>
            </div>
            <Button size="lg" onClick={() => setInviteOpen(true)} className="shrink-0">
              <UserPlus className="h-5 w-5 mr-2" />
              Invitar a mi primer empleado
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`rounded-lg bg-muted p-3 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Informe Laboral</CardTitle>
              <CardDescription>Cumplimiento normativo — RDL 8/2019</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/informe-laboral')}>
              Ver informe completo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={`text-4xl font-bold ${scoreColor}`}>{compliance.score}%</p>
                <p className="text-xs text-muted-foreground mt-1">{scoreLabel}</p>
              </div>
              <div className="flex-1 space-y-2">
                <Progress value={compliance.score} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-destructive/10 p-2">
                    <p className="text-lg font-bold text-destructive">{compliance.totalCriticas}</p>
                    <p className="text-[10px] text-muted-foreground">Críticas</p>
                  </div>
                  <div className="rounded-md bg-warning/10 p-2">
                    <p className="text-lg font-bold text-[hsl(var(--warning))]">{compliance.totalAltas}</p>
                    <p className="text-[10px] text-muted-foreground">Altas</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-lg font-bold text-muted-foreground">{compliance.totalMedias}</p>
                    <p className="text-[10px] text-muted-foreground">Medias</p>
                  </div>
                </div>
              </div>
            </div>
            {compliance.exposicionTotal > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">
                  Exposición económica: <span className="font-semibold">{compliance.exposicionTotal.toLocaleString('es-ES')} €</span>
                </p>
              </div>
            )}
            {compliance.infracciones.length === 0 && (
              <div className="flex flex-col items-center py-4 text-muted-foreground">
                <Shield className="h-8 w-8 mb-2 text-success opacity-60" />
                <p className="text-sm">Sin infracciones detectadas</p>
                <p className="text-xs">Registra fichajes para analizar cumplimiento</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickLinks.map((link) => (
              <Button key={link.label} variant="outline" className="justify-start gap-2" onClick={link.action}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cumpleaños y aniversarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">No hay eventos próximos</p>
              <p className="text-xs">Añade empleados para ver cumpleaños</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Sin actividad reciente</p>
              <p className="text-xs">La actividad aparecerá aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {canManage && <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} />}
    </div>
  );
}
