import "./MenuDrawer.css";
import { FiX, FiHome, FiFolder, FiActivity, FiUser } from 'react-icons/fi';

export default function MenuDrawer({ open, setOpen }) {
  return (
    <div className={`drawer ${open ? "open" : ""}`}>
      <div className="drawer-header">
        <h3>Menu</h3>
        <FiX className="drawer-close" onClick={() => setOpen(false)} aria-label="Close menu" />
      </div>

      <ul className="drawer-links">
        <li><FiHome /> Home</li>
        <li><FiFolder /> My Aids</li>
        <li><FiActivity /> Simulations</li>
        <li><FiUser /> Profile</li>
      </ul>
    </div>
  );
}
