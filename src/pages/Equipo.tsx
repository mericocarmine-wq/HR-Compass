import { useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useRole } from '@/hooks/useRole';
import { InviteModal } from '@/components/InviteModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Plus } from 'lucide-react';

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  empleado: 'Empleado',
};

export default function Equipo() {
  const { members } = useCompany();
  const { canManage } = useRole();
  const [inviteOpen, setInviteOpen] = useState(false);

  const getInitials = (member: typeof members[0]) => {
    if (member.full_name) {
      return member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return member.email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-muted-foreground">
            {members.length} miembro{members.length !== 1 ? 's' : ''} en tu equipo
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Añadir empleado
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No hay miembros aún</p>
              <p className="text-sm mb-4">Invita a tu primer empleado para empezar</p>
              {canManage && (
                <Button onClick={() => setInviteOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Invitar empleado
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha invitación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(m)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{m.full_name || m.email}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>
                        {roleLabels[m.role] || m.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.department || '—'}</TableCell>
                    <TableCell>
                      {m.status === 'active' ? (
                        <Badge className="bg-success text-success-foreground">Activo</Badge>
                      ) : m.status === 'inactive' ? (
                        <Badge variant="secondary">Inactivo</Badge>
                      ) : (
                        <Badge className="bg-warning text-warning-foreground">Pendiente de aceptar</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(m.invited_at).toLocaleDateString('es-ES')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {canManage && <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} />}
    </div>
  );
}
