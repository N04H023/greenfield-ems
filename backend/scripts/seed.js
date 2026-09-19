require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function seed() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to database');

    // Clear existing data (in reverse order due to foreign keys)
    await pool.request().query('DELETE FROM vouchers');
    await pool.request().query('DELETE FROM projects');
    await pool.request().query('DELETE FROM users');
    console.log('🧹 Cleared existing data');

    // Hash passwords
    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // Seed Users (3 roles: admin, manager, employee)
    await pool.request().query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Rahul Sharma', 'admin@greenfield.com', '${hashedPassword}', 'admin'),
      ('Priya Patel', 'manager@greenfield.com', '${hashedPassword}', 'manager'),
      ('Amit Kumar', 'employee@greenfield.com', '${hashedPassword}', 'employee')
    `);
    console.log('✅ Seeded: 3 users (admin, manager, employee)');

    // Get user IDs for foreign keys
    const users = await pool.request().query('SELECT id, role FROM users');
    const admin = users.recordset.find(u => u.role === 'admin');
    const manager = users.recordset.find(u => u.role === 'manager');
    const employee = users.recordset.find(u => u.role === 'employee');

    // Seed Projects
    await pool.request().query(`
      INSERT INTO projects (name, code, budget, created_by) VALUES
      ('Highway Bridge Construction', 'HBC-001', 5000000.00, ${admin.id}),
      ('School Renovation Phase 2', 'SRP-002', 1500000.00, ${admin.id}),
      ('Water Treatment Plant', 'WTP-003', 3000000.00, ${admin.id})
    `);
    console.log('✅ Seeded: 3 projects');

    // Get project IDs
    const projects = await pool.request().query('SELECT id, code FROM projects');
    const proj1 = projects.recordset;
    const proj2 = projects.recordset;

    // Seed Vouchers (different statuses to test approval flow)
    await pool.request().query(`
      INSERT INTO vouchers (project_id, created_by, amount, description, status) VALUES
      (${proj1.id}, ${employee.id}, 25000.00, 'Cement purchase - 50 bags', 'submitted'),
      (${proj1.id}, ${employee.id}, 8500.00, 'Site labour wages - Week 12', 'approved'),
      (${proj2.id}, ${employee.id}, 12000.00, 'Paint and materials', 'draft'),
      (${proj2.id}, ${employee.id}, 45000.00, 'Electrical wiring contract', 'rejected'),
      (${proj1.id}, ${employee.id}, 3200.00, 'Transportation charges', 'submitted')
    `);
    console.log('✅ Seeded: 5 vouchers');

    console.log('
🎉 Seed complete! Test credentials:');
    console.log('   Admin:    admin@greenfield.com    / Password@123');
    console.log('   Manager:  manager@greenfield.com  / Password@123');
    console.log('   Employee: employee@greenfield.com / Password@123');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    if (pool) await pool.close();
    process.exit(0);
  }
}

seed();
