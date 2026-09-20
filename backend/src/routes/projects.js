const express = require('express');
const { getPool, sql } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
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

router.post('/', authenticate, async (req, res) => {
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

router.delete('/:id', authenticate, async (req, res) => {
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
Fix vouchers.js
bash





cat > src/routes/vouchers.js
Paste this, then Ctrl+D:

const express = require('express');
const multer = require('multer');
const path = require('path');
const { getPool, sql } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function(req, file, cb) {
    var uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

var upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    var allowed = /jpeg|jpg|png|pdf/;
    var ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    var pool = await getPool();
    var query = req.user.role === 'employee'
      ? 'SELECT v.*, p.name as project_name, u.name as submitted_by_name FROM vouchers v LEFT JOIN projects p ON v.project_id = p.id LEFT JOIN users u ON v.submitted_by = u.id WHERE v.submitted_by = @userId ORDER BY v.created_at DESC'
      : 'SELECT v.*, p.name as project_name, u.name as submitted_by_name FROM vouchers v LEFT JOIN projects p ON v.project_id = p.id LEFT JOIN users u ON v.submitted_by = u.id ORDER BY v.created_at DESC';
    var request = pool.request();
    if (req.user.role === 'employee') {
      request.input('userId', sql.Int, req.user.id);
    }
    var result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Get vouchers error:', err);
    res.status(500).json({ error: 'Failed to fetch vouchers' });
  }
});

router.post('/', authenticate, upload.single('receipt'), async (req, res) => {
  try {
    var { project_id, description, amount } = req.body;
    if (!project_id || !amount) {
      return res.status(400).json({ error: 'Project and amount are required' });
    }
    var pool = await getPool();
    var receipt_path = req.file ? '/uploads/' + req.file.filename : null;
    var result = await pool.request()
      .input('project_id', sql.Int, project_id)
      .input('description', sql.VarChar, description || '')
      .input('amount', sql.Decimal(18, 2), amount)
      .input('receipt_path', sql.VarChar, receipt_path)
      .input('submitted_by', sql.Int, req.user.id)
      .query("INSERT INTO vouchers (project_id, description, amount, receipt_path, submitted_by, status) OUTPUT INSERTED.* VALUES (@project_id, @description, @amount, @receipt_path, @submitted_by, 'pending')");
    res.status(201).json(result.recordset);
  } catch (err) {
    console.error('Create voucher error:', err);
    res.status(500).json({ error: 'Failed to create voucher' });
  }
});

router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ error: 'Only managers and admins can approve vouchers' });
    }
    var pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('approved_by', sql.Int, req.user.id)
      .query("UPDATE vouchers SET status = 'approved', approved_by = @approved_by, updated_at = GETDATE() WHERE id = @id");
    res.json({ message: 'Voucher approved' });
  } catch (err) {
    console.error('Approve voucher error:', err);
    res.status(500).json({ error: 'Failed to approve voucher' });
  }
});

router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'employee') {
      return res.status(403).json({ error: 'Only managers and admins can reject vouchers' });
    }
    var pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('approved_by', sql.Int, req.user.id)
      .query("UPDATE vouchers SET status = 'rejected', approved_by = @approved_by, updated_at = GETDATE() WHERE id = @id");
    res.json({ message: 'Voucher rejected' });
  } catch (err) {
    console.error('Reject voucher error:', err);
    res.status(500).json({ error: 'Failed to reject voucher' });
  }
});

module.exports = router;
