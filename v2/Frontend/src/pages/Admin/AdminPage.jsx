export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-1 text-gray-600">
          Comprehensive platform administration and management
        </p>
      </div>

      {/* Coming Soon */}
      <div className="bg-white shadow-sm rounded-lg p-12 text-center">
        <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-2a2 2 0 012-2h2a2 2 0 012 2v2m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Features Coming Soon</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          The comprehensive admin panel with user management, analytics, and system controls is currently under development.
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">User Management</h3>
            <p className="text-sm text-gray-500 mt-1">Manage patients, therapists, and administrators</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Analytics Dashboard</h3>
            <p className="text-sm text-gray-500 mt-1">Platform metrics and usage statistics</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">System Monitoring</h3>
            <p className="text-sm text-gray-500 mt-1">Server health and performance monitoring</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Audit Logs</h3>
            <p className="text-sm text-gray-500 mt-1">Complete activity and security logging</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Content Management</h3>
            <p className="text-sm text-gray-500 mt-1">Platform content and resource management</p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900">Settings & Config</h3>
            <p className="text-sm text-gray-500 mt-1">Platform configuration and settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
