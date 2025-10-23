import { Role } from '@/types';

export const hasAccess = (userRole: Role, allowedRoles: Role[]): boolean => {
  return allowedRoles.includes(userRole);
};

// Medicines - only store_officer can view
export const canViewMedicines = (role: Role): boolean => {
  return role === 'store_officer';
};

// Medicines - management only for these roles
export const canManageMedicines = (role: Role): boolean => {
  return ['superadmin', 'admin', 'store_officer'].includes(role);
};

// Delegation - only Store Officer can delegate
export const canDelegate = (role: Role): boolean => {
  return role === 'store_officer';
};

// View delegated drugs - IPP and Dispensary
export const canViewDelegated = (role: Role): boolean => {
  return ['ipp', 'dispensary'].includes(role);
};

// User Management - Only SuperAdmin
export const canManageUsers = (role: Role): boolean => {
  return role === 'superadmin';
};

// Password Reset - Only SuperAdmin
export const canResetPassword = (role: Role): boolean => {
  return role === 'superadmin';
};

// System Settings - Only SuperAdmin
export const canAccessSettings = (role: Role): boolean => {
  return role === 'superadmin';
};

// Audit Logs - Only SuperAdmin
export const canViewAuditLogs = (role: Role): boolean => {
  return role === 'superadmin';
};

// Delete Users - Only SuperAdmin
export const canDeleteUsers = (role: Role): boolean => {
  return role === 'superadmin';
};

// Sales - Only IPP and Dispensary
export const canAccessSales = (role: Role): boolean => {
  return ['ipp', 'dispensary'].includes(role);
};

// Reports - Superadmin and Admin only (not Store Officer)
export const canAccessReports = (role: Role): boolean => {
  return ['superadmin', 'admin'].includes(role);
};

// Reports view - alias for consistency
export const canViewReports = (role: Role): boolean => {
  return canAccessReports(role);
};

// User Management View - Superadmin and Admin can view
export const canViewUsers = (role: Role): boolean => {
  return ['superadmin', 'admin'].includes(role);
};
