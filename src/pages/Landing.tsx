import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Clock, Users, FileText, PlayCircle } from 'lucide-react';

const DEMO_EMAIL = 'carmine.merico@hotmail.com';
const DEMO_PASSWORD = 'invitado1234';

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verDemo = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    if (error) setError('No se pudo abrir la demo. Inténtalo de nuevo.');
    setLoading(false);
  };

  const features = [
    { icon: Clock, title: 'Registro de jornada', desc: 'Fichajes conformes al RD-ley 8/2019 con conservación de 4 años.' },
    { icon: Users, title: 'Expediente digital', desc: 'Empleados, contratos, departamentos y equipos en un solo lugar.' },
    { icon: ShieldCheck, title: 'Informe laboral', desc: 'Detección de riesgos legales y exposición económica LISOS.' },
    { icon: FileText, title: 'Nóminas y documentos', desc: 'Distribución y archivo documental por empleado.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">A</div>
          <span className="font-semibold">Axontia RRHH</span>
        </div>
        <Button variant="ghost" onClick={() => navigate('/login')}>Iniciar sesión</Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            La plataforma de RRHH con cumplimiento legal español
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Gestiona jornada, ausencias, nóminas y riesgos laborales de toda tu plantilla.
            Explora la demo completa de <strong>Sandex S.L.</strong> con 100 empleados y datos reales de uso.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={verDemo} disabled={loading}>
              <PlayCircle className="mr-2 h-5 w-5" />
              {loading ? 'Abriendo demo...' : 'VER DEMO'}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="flex gap-4 p-6">
                <f.icon className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <h2 className="font-semibold">{f.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
