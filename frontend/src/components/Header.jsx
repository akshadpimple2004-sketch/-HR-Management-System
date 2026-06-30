import React from 'react';

const Header = ({ title }) => {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '20px'
    }}>
      <div>
        <h2 style={{ fontSize: '1.85rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Console Overview & Management
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <div className="glass-panel" style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          System Node: <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>Active</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
