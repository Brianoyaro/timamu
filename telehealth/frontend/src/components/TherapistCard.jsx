import { Link } from 'react-router-dom';

export default function TherapistCard({ therapist, onBook, showBookButton = true }) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {therapist.user.name || 'Therapist'}
          </h3>
          <p className="text-sm text-primary-600 font-medium">
            {therapist.specialization}
          </p>
        </div>
        {therapist.isApproved && (
          <span className="badge badge-success">Approved</span>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 line-clamp-3">{therapist.bio}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500">
          License: {therapist.licenseNumber}
        </p>
      </div>

      {/* Availability */}
      {therapist.availability &&
        Object.keys(therapist.availability).length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Availability:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(therapist.availability)
                .slice(0, 3)
                .map(([day]) => (
                  <span
                    key={day}
                    className="text-xs px-2 py-1 bg-gray-100 rounded"
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                ))}
              {Object.keys(therapist.availability).length > 3 && (
                <span className="text-xs px-2 py-1 text-gray-500">
                  +{Object.keys(therapist.availability).length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

      {showBookButton && therapist.isApproved && (
        <button
          onClick={() => onBook(therapist)}
          className="w-full btn btn-primary"
        >
          Book Session
        </button>
      )}
    </div>
  );
}
