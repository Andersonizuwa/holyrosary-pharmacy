import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email address').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const medicineSchema = yup.object().shape({
  name: yup.string().required('Medicine name is required'),
  brand: yup.string().required('Brand is required'),
  quantity: yup.number()
    .min(0, 'Quantity must be positive')
    .required('Quantity is required'),
  unit: yup.string().required('Unit is required'),
  expiryDate: yup.date()
    .min(new Date(), 'Expiry date must be in the future')
    .required('Expiry date is required'),
  lowStockThreshold: yup.number()
    .min(0, 'Threshold must be positive')
    .required('Low stock threshold is required'),
  price: yup.number()
    .min(0, 'Price must be positive')
    .required('Price is required'),
});

export const delegationSchema = yup.object().shape({
  medicineId: yup.string().required('Medicine is required'),
  quantity: yup.number()
    .min(1, 'Quantity must be at least 1')
    .required('Quantity is required'),
  toRole: yup.string()
    .oneOf(['ipp', 'dispensary'], 'Invalid role')
    .required('Recipient role is required'),
  toUserId: yup.string().optional(),
});

export const saleSchema = yup.object().shape({
  items: yup.array().of(
    yup.object().shape({
      medicineId: yup.string().required('Medicine is required'),
      quantity: yup.number()
        .min(1, 'Quantity must be at least 1')
        .required('Quantity is required'),
      price: yup.number()
        .min(0, 'Price must be positive')
        .required('Price is required'),
    })
  ).min(1, 'At least one item is required'),
});

export const userSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  role: yup.string()
    .oneOf(['superadmin', 'admin', 'storeofficer', 'ipp', 'dispensary'], 'Invalid role')
    .required('Role is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

/**
 * Password reset schema - friendly validation
 * Requires:
 * - Minimum 8 characters
 * - Password confirmation
 */
export const passwordResetSchema = yup.object().shape({
  newPassword: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});
