export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  STORE_OFFICER: 'store_officer',
  IPP: 'ipp',
  DISPENSARY: 'dispensary',
} as const;

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  store_officer: 'Store Officer',
  ipp: 'IPP',
  dispensary: 'Dispensary',
} as const;

export const UNITS = ['Tablets', 'Capsules', 'Bottles', 'Vials', 'Boxes', 'Strips', 'ml', 'mg', 'g'];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const TOKEN_KEY = 'holyrosa_token';
export const USER_KEY = 'holyrosa_user';
