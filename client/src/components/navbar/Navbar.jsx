import { useState } from 'react';
import './Navbar.css';
import MenuDrawer from './MenuDrawer';

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const isConnected = true;

    return (
        <>
            <nav className="navbar">
                {/* LEFT SIDE (Desktop) / RIGHT SIDE (Mobile) */}
                <div 
                  className="nav-left" 
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                    <i className="ri-menu-line nav-icon"></i>
                </div>

                {/* CENTERED LOGO (desktop) / RIGHT-ALIGNED (mobile) */}
                <div>
                    <span className="logo-blue">AIDE</span>
                    <span className="logo-red">+</span>
                </div>

                {/* RIGHT SIDE (Desktop) / LEFT SIDE (Mobile) */}
                <div className="nav-right">
                    {/* USER ICON */}
                    <i
                      className={`ri-user-3-fill user-icon ${
                        isConnected ? "user-connected" : "user-disconnected"
                      }`}
                    ></i>

                    {/* SETTINGS */}
                    <i
                      className="ri-settings-3-line nav-icon"
                      onClick={() => setSettingsOpen(!settingsOpen)}
                    ></i>

                    {/* SETTINGS DROPDOWN */}
                    {settingsOpen && (
                        <div className="settings-dropdown">
                            <div>🌐 Language</div>
                            <div>🌙 Theme</div>
                        </div>
                    )}
                </div>
            </nav>

            <MenuDrawer open={menuOpen} setOpen={setMenuOpen} />
        </>
    );
}