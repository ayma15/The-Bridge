import { FaCheckCircle } from 'react-icons/fa';

const VerifiedBadge = ({ className = '' }) => (
  <span 
    className={`inline-flex items-center text-blue-500 ${className}`}
    title="Verified Account"
    aria-label="Verified Account"
  >
    <FaCheckCircle className="w-4 h-4 ml-1" />
  </span>
);

export default VerifiedBadge;
