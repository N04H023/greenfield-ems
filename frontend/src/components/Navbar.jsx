import { Link, useNavigate, useLocation } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Highlight the active page link
  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      {/* Left: App name + links */}
      <div style={styles.left}>
        <Link to="/dashboard" style={styles.brand}>
          Greenfield EMS
        </Link>

        <div style={styles.links}>
          <Link
            to="/dashboard"
            style={{
              ...styles.link,
              ...(isActive('/dashboard') ? styles.activeLink : {}),
            }}
          >
            Dashboard
          </Link>
          <Link
            to="/projects"
            style={{
              ...styles.link,
              ...(isActive('/projects') ? styles.activeLink : {}),
            }}
          >
            Projects
          </Link>
          <Link
            to="/vouchers"
            style={{
              ...styles.link,
              ...(isActive('/vouchers') ? styles.activeLink : {}),
            }}
          >
            Vouchers
          </Link>
        </div>
      </div>

      {/* Right: User info + logout */}
      <div style={styles.right}>
        <span style={styles.userInfo}>
          {user.name}
          <span style={styles.roleBadge}>{user.role}</span>
        </span>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    height: '60px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  brand: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    gap: '5px',
  },
  link: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
  },
  activeLink: {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  userInfo: {
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    textTransform: 'uppercase',
  },
  logoutBtn: {
    padding: '6px 16px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default Navbar;
