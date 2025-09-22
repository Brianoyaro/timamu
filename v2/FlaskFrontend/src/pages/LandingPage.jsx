import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-indigo-600">Timamu</span>
        </h1>
        <p className="mt-3 text-xl text-gray-500 sm:mt-5">
          A secure platform connecting patients with mental health professionals
        </p>
        <div className="mt-10 flex justify-center">
          <div className="rounded-md shadow">
            <Link
              to="/login"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
            >
              Sign In
            </Link>
          </div>
          <div className="ml-3 rounded-md shadow">
            <Link
              to="/register"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900">Patients</h3>
              <p className="mt-4 text-gray-500">
                Connect with qualified therapists, book sessions, and manage your mental health journey.
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900">Therapists</h3>
              <p className="mt-4 text-gray-500">
                Manage your practice, connect with patients, and track progress efficiently.
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900">Secure Platform</h3>
              <p className="mt-4 text-gray-500">
                Your data is protected with end-to-end encryption and secure practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;