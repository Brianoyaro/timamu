import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  StarIcon,
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import useAuthStore from '../../stores/authStore';
import { getApiUrl } from '../../utils/api';
import toast from 'react-hot-toast';

export default function TherapistsPage() {
  const { token } = useAuthStore();
  const [therapists, setTherapists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Helper function to format working hours
  const formatWorkingHours = (workingHours) => {
    if (!workingHours) return 'Mon-Fri';
    if (typeof workingHours === 'string') return workingHours;
    
    // If it's an object with day keys, format it
    if (typeof workingHours === 'object') {
      const dayKeys = Object.keys(workingHours);
      if (dayKeys.length === 0) return 'Mon-Fri';
      
      const dayNames = {
        monday: 'Mon',
        tuesday: 'Tue', 
        wednesday: 'Wed',
        thursday: 'Thu',
        friday: 'Fri',
        saturday: 'Sat',
        sunday: 'Sun'
      };
      
      const availableDays = dayKeys
        .filter(day => workingHours[day]) // Only include days that are true/available
        .map(day => dayNames[day.toLowerCase()] || day)
        .filter(Boolean);
        
      if (availableDays.length > 0) {
        return availableDays.join(', ');
      }
    }
    
    return 'Mon-Fri';
  };

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/users/therapists`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const therapistsArray = data.data?.therapists || [];
          setTherapists(therapistsArray);
        } else {
          console.error('Failed to fetch therapists:', response.status);
          setTherapists([]);
          toast.error('Failed to load therapists');
        }
      } catch (error) {
        console.error('Error fetching therapists:', error);
        setTherapists([]);
        toast.error('Failed to load therapists');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchTherapists();
    } else {
      setIsLoading(false);
      setTherapists([]);
    }
  }, [token]);

  const specialties = ['all', 'anxiety', 'depression', 'trauma', 'couples', 'family', 'addiction'];

  const filteredTherapists = Array.isArray(therapists) ? therapists.filter(therapist => 
    selectedSpecialty === 'all' || 
    therapist.therapistProfile?.specializations?.includes(selectedSpecialty)
  ) : [];

  const handleBookSession = (therapistId) => {
    // TODO: Implement booking modal or navigation
    toast.success('Booking functionality coming soon!');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Find a Therapist</h1>
        <p className="mt-1 text-gray-600">
          Connect with licensed mental health professionals
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter by Specialty</h3>
        <div className="flex flex-wrap gap-2">
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => setSelectedSpecialty(specialty)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                selectedSpecialty === specialty
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Therapists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTherapists.length === 0 ? (
          <div className="col-span-full bg-white shadow-sm rounded-lg p-12 text-center">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No therapists found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for more therapists.
            </p>
          </div>
        ) : (
          filteredTherapists.map((therapist) => (
            <div key={therapist.id} className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    {therapist.avatar ? (
                      <img
                        src={therapist.avatar}
                        alt={`${therapist.firstName} ${therapist.lastName}`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-semibold text-blue-600">
                        {therapist.firstName[0]}{therapist.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {therapist.firstName} {therapist.lastName}
                    </h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-4 w-4 ${
                              i < (therapist.rating || 5) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {therapist.rating || 5.0} ({therapist.reviewCount || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    <span>{typeof therapist.therapistProfile?.education === 'string' 
                      ? therapist.therapistProfile.education 
                      : 'Licensed Therapist'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>Online Sessions</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>Available {formatWorkingHours(therapist.therapistProfile?.workingHours)}</span>
                  </div>
                </div>

                {therapist.therapistProfile?.specializations && Array.isArray(therapist.therapistProfile.specializations) && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {therapist.therapistProfile.specializations.slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded"
                        >
                          {String(specialty)}
                        </span>
                      ))}
                      {therapist.therapistProfile.specializations.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          +{therapist.therapistProfile.specializations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={() => handleBookSession(therapist.id)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mock data for demonstration */}
      {filteredTherapists.length === 0 && selectedSpecialty === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 1,
              firstName: 'Sarah',
              lastName: 'Johnson',
              credentials: 'Licensed Clinical Social Worker',
              specialties: ['anxiety', 'depression', 'trauma'],
              rating: 4.9,
              reviewCount: 127,
              location: 'Online Sessions',
              availability: 'Mon-Fri 9am-7pm'
            },
            {
              id: 2,
              firstName: 'Michael',
              lastName: 'Chen',
              credentials: 'Licensed Marriage & Family Therapist',
              specialties: ['couples', 'family', 'communication'],
              rating: 4.8,
              reviewCount: 89,
              location: 'Online Sessions',
              availability: 'Tue-Sat 10am-8pm'
            },
            {
              id: 3,
              firstName: 'Emily',
              lastName: 'Davis',
              credentials: 'Licensed Professional Counselor',
              specialties: ['addiction', 'trauma', 'anxiety'],
              rating: 5.0,
              reviewCount: 156,
              location: 'Online Sessions',
              availability: 'Mon-Thu 8am-6pm'
            }
          ].map((therapist) => (
            <div key={therapist.id} className="bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xl font-semibold text-blue-600">
                      {therapist.firstName[0]}{therapist.lastName[0]}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {therapist.firstName} {therapist.lastName}
                    </h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-4 w-4 ${
                              i < therapist.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">
                        {therapist.rating} ({therapist.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    <span>{therapist.credentials}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span>{therapist.location}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>Available {therapist.availability}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap gap-1">
                    {therapist.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handleBookSession(therapist.id)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
