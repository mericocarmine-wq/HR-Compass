import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';

const departamentos = ['Dirección', 'Desarrollo', 'Marketing', 'Ventas', 'RRHH', 'Finanzas', 'Operaciones', 'Soporte'];
const rolesPermitidos = new Set(['owner', 'admin', 'manager']);

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteModal({ open, onOpenChange }: InviteModalProps) {
  const { company, membership, refetchMembers } = useCompany();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('empleado');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canInvite = useMemo(
    () => !!membership && rolesPermitidos.has(membership.role) && membership.status === 'active',
    [membership]
  );

  const resetForm = () => {
    setEmail('');
    setRole('empleado');
    setDepartment('');
    setError('');
    setLoading(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !email.trim()) return;
    if (!canInvite) {
      setError('No tienes permisos para invitar empleados.');
      return;
    }

    setLoading(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Tu sesión ha caducado. Cierra sesión y vuelve a entrar.');
      setLoading(false);
      return;
    }

    const res = await supabase.functions.invoke('invite-member', {
      body: {
        company_id: company.id,
        email: email.trim().toLowerCase(),
        role,
        department: department || null,
      },
    });

    if (res.error || res.data?.error) {
      setError(res.error?.message || res.data?.error || 'Error al invitar');
      setLoading(false);
      return;
    }

    await refetchMembers();
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Invitar empleado</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="empleado@empresa.com"
              required
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empleado">Empleado</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Departamento</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            El empleado recibirá un enlace seguro para establecer su acceso.
          </p>
          {!canInvite && (
            <p className="text-sm text-muted-foreground">
              Solo owner, admin y manager pueden enviar invitaciones.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !canInvite}>
              {loading ? 'Creando...' : 'Crear empleado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
