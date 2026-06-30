import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'var(--accent-primary)' }) => {
  return (
    <div className="glass-panel animate-fade-in" style={{
      padding: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flex: '1',
      minWidth: '220px'
    }}>
      <div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <h3 style={{ fontSize: '2rem', marginTop: '8px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
          {value}
        </h3>
      </div>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
};

export default StatCard;
