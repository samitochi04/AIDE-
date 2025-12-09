import { useState } from 'react';
import './Navbar.css';
import MenuDrawer from './MenuDrawer';
import { FiMenu, FiUser, FiSettings } from 'react-icons/fi';
import useUser from '../../features/user/useUser'
import AuthForm from '../../features/user/AuthForm'

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const { user, profile, signOut } = useUser()
    const isConnected = !!user

    return (
        <>
            <nav className="navbar">
                {/* LEFT SIDE (Desktop) / RIGHT SIDE (Mobile) */}
                                <div 
                                    className="nav-left" 
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    role="button"
                                    aria-label="Open menu"
                                >
                                        <FiMenu className="nav-icon" />
                                </div>

                {/* CENTERED LOGO (desktop) / RIGHT-ALIGNED (mobile) */}
                <div className="nav-logo">
                    <span className="logo-blue">AIDE</span>
                    <span className="logo-red">+</span>
                </div>

                {/* RIGHT SIDE (Desktop) / LEFT SIDE (Mobile) */}
                <div className="nav-right">
                    {/* USER ICON */}
                                        <FiUser
                                            className={`user-icon ${
                                                isConnected ? "user-connected" : "user-disconnected"
                                            }`}
                                            aria-hidden={false}
                                            title={isConnected ? 'Connected' : 'Disconnected'}
                                        />

                    {/* SETTINGS */}
                                        <FiSettings
                                            className="nav-icon"
                                            onClick={() => setSettingsOpen(!settingsOpen)}
                                            role="button"
                                            aria-label="Open settings"
                                        />

                    {/* SETTINGS DROPDOWN */}
                    {settingsOpen && (
                        <div className="settings-dropdown">
                            {isConnected ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ fontWeight: 600 }}>{profile?.full_name ?? user.email}</div>
                                    <div style={{ fontSize: 13, color: '#6b7280' }}>{profile?.region ?? ''}</div>
                                    <button onClick={() => { signOut(); setSettingsOpen(false) }} style={{ padding: '8px 10px', borderRadius: 8, background: '#ef4444', color: 'white', border: 'none' }}>Se déconnecter</button>
                                </div>
                            ) : (
                                <AuthForm onClose={() => setSettingsOpen(false)} />
                            )}
                        </div>
                    )}
                </div>
            </nav>

            <MenuDrawer open={menuOpen} setOpen={setMenuOpen} />
        </>
    );
}