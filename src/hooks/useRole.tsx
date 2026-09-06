import { useCompany } from './useCompany';

export function useRole() {
  const { membership } = useCompany();
  const role = membership?.role || 'empleado';

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isEmpleado = role === 'empleado';

  // Can manage team: owner, admin, manager
  const canManage = isOwner || isAdmin || isManager;

  return { role, isOwner, isAdmin, isManager, isEmpleado, canManage, membership };
}
