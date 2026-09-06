import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Pencil, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { store } from '@/lib/store';
import { Empleado } from '@/types/hr';
import { useCompany } from '@/hooks/useCompany';
import { InviteModal } from '@/components/InviteModal';
import { supabase } from '@/integrations/supabase/client';

const departamentos = ['Dirección', 'Desarrollo', 'Marketing', 'Ventas', 'RRHH', 'Finanzas', 'Operaciones', 'Soporte'];
const emptyEmpleado: Omit<Empleado, 'id'> = {
  nombre: '', apellidos: '', dni: '', email: '', telefono: '',
  departamento: '', puesto: '', fechaAlta: new Date().toISOString().split('T')[0], tipoContrato: 'indefinido',
};

const roleLabels: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  empleado: 'Empleado',
};

function StatusBadge({ status }: { status?: string | null }) {
  if (status === 'active') {
    return <Badge className="bg-success text-success-foreground">Activo</Badge>;
  }
  if (status === 'inactive') {
    return <Badge variant="secondary">Inactivo</Badge>;
  }
  if (status === 'pending') {
    return <Badge className="bg-warning text-warning-foreground">Pendiente</Badge>;
  }
  return <Badge variant="outline">Sin acceso</Badge>;
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState(store.getEmpleados());
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState(emptyEmpleado);
  const [editId, setEditId] = useState<string | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState('');
  const navigate = useNavigate();
  const { members, membership, refetchMembers } = useCompany();

  const accessMembers = useMemo(() => members.filter((member) => member.role !== 'owner'), [members]);
  const canManageMembers = !!membership && ['owner', 'admin', 'manager'].includes(membership.role) && membership.status === 'active';

  const save = (list: Empleado[]) => {
    setEmpleados(list);
    store.setEmpleados(list);
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.apellidos || !form.email) return;

    if (editId) {
      save(empleados.map((empleado) => empleado.id === editId ? { ...form, id: editId } as Empleado : empleado));
    } else {
      save([...empleados, { ...form, id: crypto.randomUUID() } as Empleado]);
    }

    setForm(emptyEmpleado);
    setEditId(null);
    setOpen(false);
  };

  const handleEdit = (empleado: Empleado) => {
    const { id, ...rest } = empleado;
    setForm(rest);
    setEditId(id);
    setOpen(true);
  };

  const handleDelete = (id: string) => save(empleados.filter((empleado) => empleado.id !== id));

  const handleMemberStatusChange = async (memberId: string, nextStatus: 'active' | 'inactive' | 'pending') => {
    if (!canManageMembers) {
      setStatusError('No tienes permisos para cambiar estados.');
      return;
    }

    setStatusLoadingId(memberId);
    setStatusError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setStatusError('Tu sesión ha caducado. Cierra sesión y vuelve a entrar.');
      setStatusLoadingId(null);
      return;
    }

    const { error } = await supabase.rpc('set_company_member_status', {
      _member_id: memberId,
      _status: nextStatus,
    });

    if (error) {
      setStatusError(error.message);
      setStatusLoadingId(null);
      return;
    }

    await refetchMembers();
    setStatusLoadingId(null);
  };

  const filtered = empleados.filter((empleado) =>
    `${empleado.nombre} ${empleado.apellidos} ${empleado.departamento} ${empleado.puesto} ${empleado.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const getAccessByEmail = (email: string) => accessMembers.find((member) => member.email.toLowerCase() === email.toLowerCase()) || null;

  const contractBadge = (tipo: string) => {
    const map: Record<string, string> = { indefinido: 'Indefinido', temporal: 'Temporal', practicas: 'Prácticas', formacion: 'Formación' };
    return <Badge variant={tipo === 'indefinido' ? 'default' : 'secondary'}>{map[tipo] || tipo}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Empleados</h1>
          <p className="text-muted-foreground">{empleados.length} empleado{empleados.length !== 1 ? 's' : ''} registrado{empleados.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Invitar empleado
          </Button>
          <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setForm(emptyEmpleado); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Añadir empleado</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'Editar' : 'Nuevo'} empleado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nombre *</Label><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
                  <div><Label>Apellidos *</Label><Input value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>DNI/NIE</Label><Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} /></div>
                  <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Teléfono</Label><Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
                  <div>
                    <Label>Departamento</Label>
                    <Select value={form.departamento} onValueChange={(value) => setForm({ ...form, departamento: value })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{departamentos.map((departamento) => <SelectItem key={departamento} value={departamento}>{departamento}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Puesto</Label><Input value={form.puesto} onChange={(e) => setForm({ ...form, puesto: e.target.value })} /></div>
                  <div>
                    <Label>Tipo contrato</Label>
                    <Select value={form.tipoContrato} onValueChange={(value) => setForm({ ...form, tipoContrato: value as Empleado['tipoContrato'] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="indefinido">Indefinido</SelectItem>
                        <SelectItem value="temporal">Temporal</SelectItem>
                        <SelectItem value="practicas">Prácticas</SelectItem>
                        <SelectItem value="formacion">Formación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Fecha de alta</Label><Input type="date" value={form.fechaAlta} onChange={(e) => setForm({ ...form, fechaAlta: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); setForm(emptyEmpleado); setEditId(null); }}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editId ? 'Guardar' : 'Crear empleado'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Invitaciones y estados</CardTitle>
            <CardDescription>Activa, inactiva o deja pendiente el acceso de cada empleado</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setInviteOpen(true)} disabled={!canManageMembers}>
            <UserPlus className="h-4 w-4 mr-1" /> Invitar empleado
          </Button>
        </CardHeader>
        <CardContent>
          {statusError && <p className="mb-4 text-sm text-destructive">{statusError}</p>}
          {accessMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">No hay invitaciones todavía</p>
              <p className="text-sm">Invita empleados para gestionar su acceso desde aquí</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[200px]">Cambiar estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.full_name || member.email}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabels[member.role] || member.role}</Badge>
                    </TableCell>
                    <TableCell>{member.department || '—'}</TableCell>
                    <TableCell><StatusBadge status={member.status} /></TableCell>
                    <TableCell>
                      <Select
                        value={member.status}
                        onValueChange={(value) => handleMemberStatusChange(member.id, value as 'active' | 'inactive' | 'pending')}
                        disabled={!canManageMembers || statusLoadingId === member.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, departamento..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No hay empleados</p>
              <p className="text-sm mb-4">Añade o invita a tu primer empleado para empezar</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setInviteOpen(true)}>Invitar empleado</Button>
                <Button onClick={() => setOpen(true)}>Crear empleado</Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Estado acceso</TableHead>
                  <TableHead>Fecha alta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((empleado) => {
                  const access = getAccessByEmail(empleado.email);

                  return (
                    <TableRow key={empleado.id} className="cursor-pointer" onClick={() => navigate(`/empleados/${empleado.id}`)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{empleado.nombre} {empleado.apellidos}</p>
                          <p className="text-xs text-muted-foreground">{empleado.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{empleado.departamento || '—'}</TableCell>
                      <TableCell>{empleado.puesto || '—'}</TableCell>
                      <TableCell>{contractBadge(empleado.tipoContrato)}</TableCell>
                      <TableCell><StatusBadge status={access?.status} /></TableCell>
                      <TableCell>{empleado.fechaAlta}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); handleEdit(empleado); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); handleDelete(empleado.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}
