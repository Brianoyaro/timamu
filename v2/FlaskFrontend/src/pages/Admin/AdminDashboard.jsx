import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Psychology as PsychologyIcon,
  CalendarMonth as CalendarMonthIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts';
import axios from 'axios';

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          backgroundColor: `${color}.lighter`,
          borderRadius: '50%',
          p: 1,
          mr: 2
        }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTherapists: 0,
    totalSessions: 0,
    pendingVerifications: 0,
    loading: true,
  });

  const [sessionData, setSessionData] = useState({
    labels: [],
    data: [],
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, sessionsResponse] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/sessions/monthly')
        ]);

        setStats({
          totalUsers: statsResponse.data.totalUsers,
          totalTherapists: statsResponse.data.totalTherapists,
          totalSessions: statsResponse.data.totalSessions,
          pendingVerifications: statsResponse.data.pendingVerifications,
          loading: false,
        });

        setSessionData({
          labels: sessionsResponse.data.labels,
          data: sessionsResponse.data.data,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Handle error state
      }
    };

    fetchDashboardData();
  }, []);

  if (stats.loading || sessionData.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon sx={{ color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Therapists"
            value={stats.totalTherapists}
            icon={<PsychologyIcon sx={{ color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={<CalendarMonthIcon sx={{ color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Verifications"
            value={stats.pendingVerifications}
            icon={<AssessmentIcon sx={{ color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Monthly Sessions</Typography>
              <Button variant="outlined" size="small">
                View Details
              </Button>
            </Box>
            <Box sx={{ width: '100%', height: 300 }}>
              <BarChart
                xAxis={[{ 
                  scaleType: 'band',
                  data: sessionData.labels,
                }]}
                series={[
                  {
                    data: sessionData.data,
                    color: 'primary.main',
                  },
                ]}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}