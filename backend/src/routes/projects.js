const express = require('express');
const { getPool, sql } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query("SELECT p.*, u.name as created_by_name, ISNULL((SELECT SUM(amount) FROM vouchers WHERE project_id = p.id AND status = 'approved'), 0) as spent FROM projects p LEFT JOIN users u ON p.created_by = u.id ORDER BY p.created_at DESC");
    res.json(result.recordset);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, code, budget } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.VarChar, name)
      .input('code', sql.VarChar, code)
      .input('budget', sql.Decimal(18, 2), budget || 0)
      .input('created_by', sql.Int, req.user.id)
      .query('INSERT INTO projects (name, code, budget, created_by) OUTPUT INSERTED.* VALUES (@name, @code, @budget, @created_by)');
    res.status(201).json(result.recordset);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete projects' });
    }
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM projects WHERE id = @id');
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router;
