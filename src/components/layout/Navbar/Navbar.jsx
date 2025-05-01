// src/components/layout/Navbar.jsx
import React from 'react';
import { Gauge, Settings, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import './Navbar.css';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className={`navbar ${theme}`}>
      <div className="navbar-container">
        <div className="navbar-brand">
          <Gauge size={22} className="brand-icon" />
          <h1>RevPI Dashboard</h1>
          <span className="version-tag">v2.0</span>
        </div>
        
        <div className="navbar-controls">
          <button 
            className="theme-toggle" 
            onClick={toggleTheme} 
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>
          
          <button className="settings-btn" aria-label="Settings">
            <Settings size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;