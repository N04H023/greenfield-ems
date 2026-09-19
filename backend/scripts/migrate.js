require('dotenv').config();
const sql = require('mssql');

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

async function migrate() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to database');

    // Table 1: Users
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'employee',
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Table: users');

    // Table 2: Projects
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
      CREATE TABLE projects (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(200) NOT NULL,
        code NVARCHAR(20) NOT NULL UNIQUE,
        budget DECIMAL(12,2) NOT NULL DEFAULT 0,
        created_by INT FOREIGN KEY REFERENCES users(id),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Table: projects');

    // Table 3: Vouchers (Expense Claims)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vouchers')
      CREATE TABLE vouchers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        project_id INT FOREIGN KEY REFERENCES projects(id),
        created_by INT FOREIGN KEY REFERENCES users(id),
        amount DECIMAL(12,2) NOT NULL,
        description NVARCHAR(500),
        receipt_path NVARCHAR(500),
        status NVARCHAR(20) NOT NULL DEFAULT 'draft',
        approved_by INT FOREIGN KEY REFERENCES users(id),
        comments NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('✅ Table: vouchers');

    console.log('
🎉 Migration complete! All tables created.');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    if (pool) await pool.close();
    process.exit(0);
  }
}

migrate();
