// components/ui/Card.tsx - Reusable stat card component
import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  onClick?: () => void;
  isLoading?: boolean;
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
};

export default function Card({
  title,
  value,
  icon,
  color,
  onClick,
  isLoading = false,
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-4 sm:p-6 transition-all ${
        onClick ? 'hover:shadow-lg cursor-pointer' : 'hover:shadow-lg'
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`${colorClasses[color]} w-8 h-8 rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        <div className="ml-4 w-0 flex-1">
          <dl>
            <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-base sm:text-lg font-semibold text-gray-900 mt-2">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                value
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
