import VerifiedBadge from './VerifiedBadge';

const UserProfile = ({ user, className = '', showEmail = true }) => {
  if (!user) return null;
  
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        {user.avatar ? (
          <img 
            className="h-10 w-10 rounded-full object-cover" 
            src={user.avatar} 
            alt={user.username || 'User'} 
          />
        ) : (
          <span className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            {(user.username || user.email)?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="ml-3">
        <div className="flex items-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.username || user.email.split('@')[0]}
          </p>
          {user.isVerified && <VerifiedBadge />}
        </div>
        {showEmail && user.email && (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
