import { useState, useEffect } from 'react';
import api from '../services/api.js';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', budget: '' });
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(function() {
    fetchProjects();
  }, []);

  var fetchProjects = async function() {
    try {
      var response = await api.get('/projects');
      setProjects(response.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  var handleChange = function(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  var handleSubmit = async function(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/projects', {
        name: form.name,
        code: form.code,
        budget: parseFloat(form.budget) || 0,
      });
      setForm({ name: '', code: '', budget: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    }
  };

  var handleDelete = async function(id, name) {
    if (!window.confirm('Delete project "' + name + '"?')) return;
    try {
      await api.delete('/projects/' + id);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Projects</h1>
        {user.role === 'admin' && (
          <button style={styles.addBtn} onClick={function() { setShowForm(!showForm); }}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New Project</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit} style={styles.form}>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Project Name" style={styles.input} required />
            <input type="text" name="code" value={form.code} onChange={handleChange} placeholder="Project Code (e.g., HBC-001)" style={styles.input} required />
            <input type="number" name="budget" value={form.budget} onChange={handleChange} placeholder="Budget" style={styles.input} />
            <button type="submit" style={styles.submitBtn}>Create Project</button>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <p style={styles.empty}>No projects yet</p>
      ) : (
        <div style={styles.grid}>
          {projects.map(function(project) {
            var spent = parseFloat(project.spent) || 0;
            var budget = parseFloat(project.budget) || 0;
            var percentage = budget > 0 ? (spent / budget) * 100 : 0;

            return (
              <div key={project.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{project.name}</h3>
                  <span style={styles.code}>{project.code}</span>
                </div>
                <div style={styles.budgetRow}>
                  <span>Budget: {budget.toLocaleString('en-IN')}</span>
                  <span>Spent: {spent.toLocaleString('en-IN')}</span>
                </div>
                <div style={styles.progressBg}>
                  <div style={{
                    height: '100%',
                    borderRadius: '4px',
                    width: Math.min(percentage, 100) + '%',
                    backgroundColor: percentage > 90 ? '#ef4444' : '#10b981',
                  }} />
                </div>
                <div style={styles.cardFooter}>
                  <span style={styles.createdBy}>By: {project.created_by_name}</span>
                  {user.role === 'admin' && (
                    <button style={styles.deleteBtn} onClick={function() { handleDelete(project.id, project.name); }}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

var styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '18px', color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: '0', color: '#1a73e8' },
  addBtn: { padding: '10px 20px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  formCard: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' },
  formTitle: { margin: '0 0 15px', color: '#333' },
  form: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', flex: '1', minWidth: '200px' },
  submitBtn: { padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  error: { backgroundColor: '#fee', color: '#c00', padding: '10px', borderRadius: '4px', marginBottom: '15px' },
  empty: { textAlign: 'center', color: '#999', padding: '40px', fontSize: '18px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  cardTitle: { margin: '0', color: '#333' },
  code: { backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  budgetRow: { display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '14px', marginBottom: '10px' },
  progressBg: { height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden', marginBottom: '15px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  createdBy: { color: '#999', fontSize: '13px' },
  deleteBtn: { padding: '5px 12px', backgroundColor: '#fee', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },
};

export default Projects;
