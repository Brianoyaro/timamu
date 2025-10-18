import { FiClock, FiVideo, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';

const SessionStatusBadge = ({ status, small = false }) => {
  const getStatusConfig = (statusValue) => {
    switch (statusValue?.toLowerCase()) {
      case 'scheduled':
        return {
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: FiClock,
          text: 'SCHEDULED'
        };
      case 'started':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: FiVideo,
          text: 'IN PROGRESS'
        };
      case 'completed':
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: FiCheckCircle,
          text: 'COMPLETED'
        };
      case 'cancelled':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: FiXCircle,
          text: 'CANCELLED'
        };
      case 'no_show':
        return {
          color: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: FiAlertCircle,
          text: 'NO SHOW'
        };
      case 'forfeited':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: FiXCircle,
          text: 'FORFEITED'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: FiAlertCircle,
          text: status?.toUpperCase() || 'UNKNOWN'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 ${
      small 
        ? 'px-1.5 py-0.5 text-[10px]' 
        : 'px-2.5 py-0.5 text-xs'
    } rounded-full font-medium border ${config.color}`}>
      <Icon className={small ? 'h-2 w-2' : 'h-3 w-3'} />
      {small ? config.text.substring(0, 1) + config.text.substring(1).toLowerCase() : config.text}
    </span>
  );
};

export default SessionStatusBadge;