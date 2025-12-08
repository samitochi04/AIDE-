import "./MenuDrawer.css";

export default function MenuDrawer({ open, setOpen }) {
  return (
    <div className={`drawer ${open ? "open" : ""}`}>
      <div className="drawer-header">
        <h3>Menu</h3>
        <i
          className="ri-close-line drawer-close"
          onClick={() => setOpen(false)}
        ></i>
      </div>

      <ul className="drawer-links">
        <li>Home</li>
        <li>My Aids</li>
        <li>Simulations</li>
        <li>Profile</li>
      </ul>
    </div>
  );
}
