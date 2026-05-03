'use client';

import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';

interface UserProfileProps {
  showLogout?: boolean;
  className?: string;
}

export default function UserProfile({ showLogout = true, className = '' }: UserProfileProps) {
  const { user, roles, logout, authenticated } = useKeycloakAuth();

  if (!authenticated || !user) {
    return null;
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username || user.email || 'User';

  const primaryRole = roles.find(role => 
    ['ADMIN', 'SUPERVISOR', 'PROFESSIONAL', 'USER'].includes(role)
  ) || roles[0] || 'USER';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {displayName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {user.email}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          {primaryRole}
        </p>
      </div>
      {showLogout && (
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
        >
          Logout
        </button>
      )}
    </div>
  );
}
