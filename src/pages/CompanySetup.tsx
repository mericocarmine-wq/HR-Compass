import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { store } from '@/lib/store';

const sectores = [
  'Tecnología', 'Finanzas', 'Salud', 'Educación', 'Retail',
  'Manufactura', 'Consultoría', 'Legal', 'Marketing', 'Otro',
];

export default function CompanySetup() {
  const { user } = useAuth();
  const { setCompany } = useCompany();
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    setError('');

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({ name: name.trim(), sector: sector || null, created_by: user.id })
      .select()
      .single();

    if (companyError) {
      setError(companyError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('company_members')
      .insert({
        company_id: companyData.id,
        user_id: user.id,
        email: user.email!,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
        full_name: user.user_metadata?.full_name || user.email,
      });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    store.setTenant(companyData.id);
    setCompany(companyData);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Registra tu empresa</CardTitle>
          <CardDescription>Configura tu empresa para empezar a gestionar tu equipo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre de la empresa *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi Empresa S.L."
                required
              />
            </div>
            <div>
              <Label>Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent>
                  {sectores.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando...' : 'Crear empresa'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
