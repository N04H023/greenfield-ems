import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projRes, vouchRes] = await Promise.all([
        api.get('/projects'),
        api.get('/vouchers'),
      ]);
      setProjects(projRes.data);
      setVouchers(vouchRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    totalProjects: projects.length,
    totalVouchers: vouchers.length,
    pending: vouchers.filter(v => v.status === 'submitted').length,
    approved: vouchers.filter(v => v.status === 'approved').length,
    rejected: vouchers.filter(v => v.status === 'rejected').length,
    draft: vouchers.filter(v => v.status === 'draft').length,
    totalAmount: vouchers.reduce((sum, v) => sum + parseFloat(v.amount), 0),
    approvedAmount: vouchers
      .filter(v => v.status === 'approved')
      .reduce((sum, v) => sum + parseFloat(v.amount), 0),
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.welcome}>
            Welcome, {user.name} ({user.role})
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #1a73e8' }}>
          <h3 style={styles.statNumber}>{stats.totalProjects}</h3>
          <p style={styles.statLabel}>Projects</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
          <h3 style={styles.statNumber}>{stats.pending}</h3>
          <p style={styles.statLabel}>Pending Approval</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #10b981' }}>
          <h3 style={styles.statNumber}>{stats.approved}</h3>
          <p style={styles.statLabel}>Approved</p>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #ef4444' }}>
          <h3 style={styles.statNumber}>{stats.rejected}</h3>
          <p style={styles.statLabel}>Rejected</p>
        </div>
      </div>

      {/* Amount Summary */}
      <div style={styles.amountRow}>
        <div style={styles.amountCard}>
          <p style={styles.amountLabel}>Total Claimed</p>
          <h2 style={styles.amountValue}>
            ₹{stats.totalAmount.toLocaleString('en-IN')}
          </h2>
        </div>
        <div style={styles.amountCard}>
          <p style={styles.amountLabel}>Total Approved</p>
          <h2 style={{ ...styles.amountValue, color: '#10b981' }}>
            ₹{stats.approvedAmount.toLocaleString('en-IN')}
          </h2>
        </div>
      </div>

      {/* Recent Vouchers */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Vouchers</h2>
          <button
            style={styles.viewAllBtn}
            onClick={() => navigate('/vouchers')}
          >
            View All
          </button>
        </div>

        {vouchers.length === 0 ? (
          <p style={styles.empty}>No vouchers yet</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Project</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.slice(0, 5).map((v) => (
                <tr key={v.id}>
                  <td style={styles.td}>{v.project_code}</td>
                  <td style={styles.td}>{v.description || '-'}</td>
                  <td style={styles.td}>₹{parseFloat(v.amount).toLocaleString('en-IN')}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: statusColors[v.status] || '#gray',
                    }}>
                      {v.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(v.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const statusColors = {
  draft: '#9ca3af',
  submitted: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    margin: '0',
    color: '#1a73e8',
  },
  welcome: {
    color: '#666',
    margin: '5px 0 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statNumber: {
    fontSize: '32px',
    margin: '0',
    color: '#333',
  },
  statLabel: {
    color: '#666',
    margin: '5px 0 0',
  },
  amountRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  amountCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  amountLabel: {
    color: '#666',
    margin: '0 0 5px',
  },
  amountValue: {
    fontSize: '28px',
    margin: '0',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  sectionTitle: {
    margin: '0',
    color: '#333',
  },
  viewAllBtn: {
    padding: '8px 16px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #eee',
    color: '#666',
    fontSize: '14px',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
};

export default Dashboard;
