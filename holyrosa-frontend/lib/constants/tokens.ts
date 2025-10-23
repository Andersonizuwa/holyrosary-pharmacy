/**
 * Design tokens for consistent styling across the application
 */

export const statusColors = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-100 text-green-800',
    icon: 'text-green-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-100 text-red-800',
    icon: 'text-red-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: 'text-yellow-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    badge: 'bg-blue-100 text-blue-800',
    icon: 'text-blue-600',
  },
};

export const roleColors = {
  superadmin: {
    badge: 'bg-purple-100 text-purple-800',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
  },
  admin: {
    badge: 'bg-indigo-100 text-indigo-800',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
  },
  storeofficer: {
    badge: 'bg-green-100 text-green-800',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
  ipp: {
    badge: 'bg-blue-100 text-blue-800',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  dispensary: {
    badge: 'bg-orange-100 text-orange-800',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
  },
};

export const medicineStatusColors = {
  inStock: {
    badge: 'bg-green-100 text-green-800',
    text: 'text-green-800',
  },
  lowStock: {
    badge: 'bg-yellow-100 text-yellow-800',
    text: 'text-yellow-800',
  },
  low_stock: {
    badge: 'bg-yellow-100 text-yellow-800',
    text: 'text-yellow-800',
  },
  outOfStock: {
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
  },
  out_of_stock: {
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
  },
  expired: {
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
  },
};

export const delegationStatusColors = {
  pending: {
    badge: 'bg-yellow-100 text-yellow-800',
    text: 'text-yellow-800',
  },
  accepted: {
    badge: 'bg-green-100 text-green-800',
    text: 'text-green-800',
  },
  rejected: {
    badge: 'bg-red-100 text-red-800',
    text: 'text-red-800',
  },
};