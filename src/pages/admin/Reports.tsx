import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { getFlaggedContent, resolveReport } from '../../services/admin.service';

interface Report {
  id: string;
  type: 'user' | 'content' | 'message';
  targetId: string;
  reporterId: string;
  reason: string;
  details: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const result = await getFlaggedContent(undefined, rowsPerPage);
      setReports(result.items);
      setTotalReports(result.items.length);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleResolveReport = async (reportId: string, resolution: 'approve' | 'reject') => {
    try {
      await resolveReport(reportId, resolution);
      fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const handleViewDetails = (report: Report) => {
    setSelectedReport(report);
    setDetailsOpen(true);
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reported On</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <Chip
                    label={report.type}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>{report.reason}</TableCell>
                <TableCell>
                  <Chip
                    label={report.status}
                    color={getStatusColor(report.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(report.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="success"
                    onClick={() => handleResolveReport(report.id, 'approve')}
                    disabled={report.status !== 'pending'}
                  >
                    <ApproveIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleResolveReport(report.id, 'reject')}
                    disabled={report.status !== 'pending'}
                  >
                    <RejectIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleViewDetails(report)}
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalReports}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Type:</strong> {selectedReport.type}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Reason:</strong> {selectedReport.reason}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Details:</strong> {selectedReport.details}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Reporter ID:</strong> {selectedReport.reporterId}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Target ID:</strong> {selectedReport.targetId}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Status:</strong> {selectedReport.status}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Created:</strong>{' '}
                {new Date(selectedReport.createdAt).toLocaleString()}
              </Typography>
              {selectedReport.resolvedAt && (
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Resolved:</strong>{' '}
                  {new Date(selectedReport.resolvedAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedReport?.status === 'pending' && (
            <>
              <Button
                color="success"
                onClick={() => {
                  handleResolveReport(selectedReport.id, 'approve');
                  setDetailsOpen(false);
                }}
              >
                Approve
              </Button>
              <Button
                color="error"
                onClick={() => {
                  handleResolveReport(selectedReport.id, 'reject');
                  setDetailsOpen(false);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports; 