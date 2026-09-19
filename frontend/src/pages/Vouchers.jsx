import { useState, useEffect } from 'react';
import api from '../services/api.js';

function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    project_id: '',
    amount: '',
    description: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vouchRes, projRes] = await Promise.all([
        api.get('/vouchers'),
        api.get('/projects'),
      ]);
      setVouchers(vouchRes.data);
      setProjects(projRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create a new voucher
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('project_id', form.project_id);
      formData.append('amount', form.amount);
      formData.append('description', form.description);
      if (receipt) {
        formData.append('receipt', receipt);
      }

      await api.post('/vouchers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setForm({ project_id: '', amount: '', description: '' });
      setReceipt(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create voucher');
    }
  };

  // Submit draft voucher for approval
  const handleSubmitForApproval = async (id) => {
    try {
      await api.put(`/vouchers/${id}/submit`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit');
    }
  };

  // Approve a voucher (manager/admin)
  const handleApprove = async (id) => {
    try {
      await api.put(`/vouchers/${id}/approve`, { comments: comment });
      setComment('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve');
    }
  };

  // Reject a voucher (manager/admin)
  const handleReject = async (id) => {
    if (!comment) {
      alert('Please enter a reason for rejection');
      return;
    }
    try {
      await api.put(`/vouchers/${id}/reject`, { comments: comment });
      setComment('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Vouchers</h1>
        <button
          style={styles.addBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ New Voucher'}
        </button>
      </div>

      {/* Create Voucher Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New Voucher</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Project</label>
                <select
                  name="project_id"
                  value={form.project_id}
                  onChange={handleChange}
                  style={styles.input}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="What was this expense for?"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Receipt (optional)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setReceipt(e.target.files)}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" style={styles.submitBtn}>
              Create Voucher
            </button>
          </form>
        </div>
      )}

      {/* Vouchers Table */}
      {vouchers.length === 0 ? (
        <p style={styles.empty}>No vouchers yet</p>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Project</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created By</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td style={styles.td}>#{v.id}</td>
                  <td style={styles.td}>{v.project_code}</td>
                  <td style={styles.td}>{v.description || '-'}</td>
                  <td style={styles.td}>
                    ₹{parseFloat(v.amount).toLocaleString('en-IN')}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: statusColors[v.status],
                      }}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td style={styles.td}>{v.created_by_name}</td>
                  <td style={styles.td}>
                    {new Date(v.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={styles.td}>
                    {/* Employee: Submit draft voucher */}
                    {v.status === 'draft' &&
                      v.created_by_name === user.name && (
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleSubmitForApproval(v.id)}
                        >
                          Submit
                        </button>
                      )}

                    {/* Manager/Admin: Approve or Reject */}
                    {v.status === 'submitted' &&
                      (user.role === 'manager' || user.role === 'admin') && (
                        <div style={styles.actionGroup}>
                          <input
                            type="text"
                            placeholder="Comments..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={styles.commentInput}
                          />
                          <button
                            style={styles.approveBtn}
                            onClick={() => handleApprove(v.id)}
                          >
                            ✅ Approve
                          </button>
                          <button
                            style={styles.rejectBtn}
                            onClick={() => handleReject(v.id)}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}

                    {/* Show comments if exists */}
                    {v.comments && (
                      <div style={styles.comments}>
                        💬 {v.comments}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: '0',
    color: '#1a73e8',
  },
  addBtn: {
    padding: '10px 20px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  formTitle: {
    margin: '0 0 15px',
    color: '#333',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginBottom: '15px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
    fontSize: '18px',
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'auto',
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
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'top',
  },
  badge: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  actionBtn: {
    padding: '6px 14px',
    backgroundColor: '#f59e0b',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  actionGroup: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  commentInput: {
    padding: '6px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    width: '150px',
  },
  approveBtn: {
    padding: '6px 10px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  rejectBtn: {
    padding: '6px 10px',
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  comments: {
    marginTop: '5px',
    fontSize: '12px',
    color: '#666',
    fontStyle: 'italic',
  },
};

export default Vouchers;
