import { useMemo } from 'react';
import { Shield, AlertTriangle, AlertCircle, CheckCircle, TrendingDown, Scale, FileWarning, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { store } from '@/lib/store';
import { analizarCumplimiento, Severidad } from '@/lib/complianceEngine';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';

const severidadConfig: Record<Severidad, { label: string; className: string; icon: typeof AlertTriangle }> = {
  CRITICA: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground', icon: AlertCircle },
  ALTA: { label: 'Alta', className: 'bg-warning text-warning-foreground', icon: AlertTriangle },
  MEDIA: { label: 'Media', className: 'bg-secondary text-secondary-foreground', icon: Shield },
};

const tipoLabels: Record<string, string> = {
  exceso_jornada: 'Exceso de Jornada',
  fichaje_incompleto: 'Fichaje Incompleto',
  descanso_insuficiente: 'Descanso Insuficiente',
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-destructive';
  const bgColor = score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-destructive';
  const label = score >= 80 ? 'Excelente' : score >= 50 ? 'Mejorable' : 'Crítico';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" className={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * 314} 314`} />
        </svg>
        <span className={`absolute text-3xl font-bold ${color}`}>{score}%</span>
      </div>
      <Badge className={bgColor}>{label}</Badge>
    </div>
  );
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

export default function InformeLaboral() {
  const { isEmpleado } = useRole();
  const { user } = useAuth();
  const { membership } = useCompany();

  const registros = store.getRegistros();

  // For empleado role, filter registros to only their own data
  // We match by the employee linked to their company member email
  const filteredRegistros = useMemo(() => {
    if (!isEmpleado) return registros;
    // Try to find the empleado record matching this user's email
    const empleados = store.getEmpleados();
    const myEmail = membership?.email || user?.email || '';
    const myEmpleado = empleados.find(e => e.email.toLowerCase() === myEmail.toLowerCase());
    if (myEmpleado) {
      return registros.filter(r => r.empleadoId === myEmpleado.id);
    }
    return [];
  }, [registros, isEmpleado, membership, user]);

  const result = useMemo(() => analizarCumplimiento(filteredRegistros), [filteredRegistros]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Informe Laboral</h1>
          <p className="text-muted-foreground">
            {isEmpleado ? 'Tu informe de cumplimiento personal' : 'Motor de cumplimiento — Normativa laboral española'}
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-primary text-primary">
          <Scale className="h-3 w-3" /> RDL 8/2019 · ET · LISOS
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <ScoreGauge score={result.score} />
            <p className="mt-2 text-xs text-muted-foreground font-medium">Compliance Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingDown className="h-4 w-4" /> Exposición Económica
            </div>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(result.exposicionTotal)}</p>
            <p className="text-xs text-muted-foreground">Suma de multas máximas potenciales (LISOS)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Desglose de Alertas</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm"><AlertCircle className="h-3.5 w-3.5 text-destructive" /> Críticas</span>
                <span className="font-bold text-destructive">{result.totalCriticas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm"><AlertTriangle className="h-3.5 w-3.5 text-warning" /> Altas</span>
                <span className="font-bold text-warning">{result.totalAltas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm"><Shield className="h-3.5 w-3.5 text-muted-foreground" /> Medias</span>
                <span className="font-bold">{result.totalMedias}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Por Tipo de Infracción</p>
            {Object.keys(result.porTipo).length === 0 ? (
              <div className="flex flex-col items-center py-4 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-1 text-success opacity-60" />
                <p className="text-xs">Sin infracciones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(result.porTipo).map(([tipo, count]) => (
                  <div key={tipo} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{tipoLabels[tipo] || tipo}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <Progress value={(count / result.infracciones.length) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" />
                Registro de Infracciones
              </CardTitle>
              <CardDescription>
                {result.infracciones.length} infraccion{result.infracciones.length !== 1 ? 'es' : ''} detectada{result.infracciones.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {result.infracciones.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-3 text-success opacity-40" />
              <p className="font-medium">Cumplimiento al 100%</p>
              <p className="text-sm mt-1">No se han detectado infracciones en los registros actuales.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="hidden md:table-cell">Descripción</TableHead>
                  <TableHead className="hidden lg:table-cell">Referencia Legal</TableHead>
                  <TableHead className="text-right">Multa Máx.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.infracciones.map((inf) => {
                  const config = severidadConfig[inf.severidad];
                  const Icon = config.icon;
                  return (
                    <TableRow key={inf.id}>
                      <TableCell>
                        <Badge className={`gap-1 ${config.className}`}>
                          <Icon className="h-3 w-3" /> {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tipoLabels[inf.tipo]}</TableCell>
                      <TableCell>{inf.fecha}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">{inf.descripcion}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-xs">{inf.referenciaLegal}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">{formatCurrency(inf.multaMax)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Aviso legal:</strong> Este informe se genera automáticamente a partir de los registros de jornada y tiene carácter orientativo.
          Las referencias legales corresponden al Estatuto de los Trabajadores (ET), Real Decreto-ley 8/2019 y la Ley sobre Infracciones y
          Sanciones en el Orden Social (LISOS). Los importes de las sanciones son rangos indicativos actualizados.
          Consulte con su asesor jurídico para una evaluación vinculante.
        </p>
      </div>
    </div>
  );
}
