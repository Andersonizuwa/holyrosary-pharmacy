'use client';

import React from 'react';
import { roleColors, medicineStatusColors, delegationStatusColors, statusColors } from '@/lib/constants/tokens';

type BadgeType = 'role' | 'medicineStatus' | 'delegationStatus' | 'status';

interface StatusBadgeProps {
  type: BadgeType;
  value: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  size = 'md',
  className = '',
}) => {
  let badgeClass = '';

  if (type === 'role' && roleColors[value as keyof typeof roleColors]) {
    badgeClass = roleColors[value as keyof typeof roleColors].badge;
  } else if (type === 'medicineStatus' && medicineStatusColors[value as keyof typeof medicineStatusColors]) {
    badgeClass = medicineStatusColors[value as keyof typeof medicineStatusColors].badge;
  } else if (type === 'delegationStatus' && delegationStatusColors[value as keyof typeof delegationStatusColors]) {
    badgeClass = delegationStatusColors[value as keyof typeof delegationStatusColors].badge;
  } else if (type === 'status' && statusColors[value as keyof typeof statusColors]) {
    badgeClass = statusColors[value as keyof typeof statusColors].badge;
  } else {
    badgeClass = 'bg-gray-100 text-gray-800';
  }

  const sizeClass = {
    sm: 'px-2 py-1 text-xs font-medium',
    md: 'px-3 py-1.5 text-sm font-medium',
    lg: 'px-4 py-2 text-base font-medium',
  }[size];

  const displayValue = value
    .split(/(?=[A-Z])/)
    .join(' ')
    .charAt(0)
    .toUpperCase() + value.split(/(?=[A-Z])/).join(' ').slice(1);

  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} ${badgeClass} ${className}`}>
      {displayValue}
    </span>
  );
};