import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

export default function TherapistVerification() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const fetchTherapists = async () => {
    try {
      const response = await axios.get('/api/admin/therapists/pending');
      setTherapists(response.data);
    } catch (error) {
      console.error('Error fetching therapists:', error);
      // Handle error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  const handleVerify = async (id) => {
    try {
      await axios.post(`/api/admin/therapists/${id}/verify`);
      fetchTherapists(); // Refresh the list
    } catch (error) {
      console.error('Error verifying therapist:', error);
      // Handle error state
    }
  };

  const handleReject = async () => {
    try {
      await axios.post(`/api/admin/therapists/${selectedTherapist.id}/reject`, {
        reason: rejectReason,
      });
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchTherapists(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting therapist:', error);
      // Handle error state
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'specialization',
      headerName: 'Specialization',
      width: 200,
      renderCell: (params) => (
        <Chip label={params.value} color="primary" variant="outlined" size="small" />
      ),
    },
    {
      field: 'submissionDate',
      headerName: 'Submission Date',
      width: 200,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              onClick={() => {
                setSelectedTherapist(params.row);
                setDetailsOpen(true);
              }}
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Approve">
            <IconButton
              onClick={() => handleVerify(params.row.id)}
              size="small"
              color="success"
            >
              <CheckCircleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton
              onClick={() => {
                setSelectedTherapist(params.row);
                setRejectDialogOpen(true);
              }}
              size="small"
              color="error"
            >
              <CancelIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Therapist Verification
      </Typography>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={therapists}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          autoHeight
          loading={loading}
        />
      </Paper>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Therapist Details</DialogTitle>
        <DialogContent>
          {selectedTherapist && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Name</Typography>
                  <Typography>{selectedTherapist.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography>{selectedTherapist.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Phone</Typography>
                  <Typography>{selectedTherapist.phone}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Specialization</Typography>
                  <Typography>{selectedTherapist.specialization}</Typography>
                </Grid>
                {/* Add more details as needed */}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Therapist Application</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}