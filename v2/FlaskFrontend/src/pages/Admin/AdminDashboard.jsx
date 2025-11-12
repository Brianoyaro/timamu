import AdminDashboardComponent from '../../components/Dashboard/AdminDashboard';
import { useAuthStore } from '../../stores/authStore';

const AdminDashboard = () => {
  const user = useAuthStore((state) => state.user);
  
  return <AdminDashboardComponent user={user} stats={{}} />;
};

export default AdminDashboard;