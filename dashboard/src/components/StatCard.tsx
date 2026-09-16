import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {icon && <span style={{ color: 'var(--text-secondary)' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        {value}
      </div>
      {trend && (
        <div style={{ 
          fontSize: '0.85rem', 
          color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
        </div>
      )}
    </div>
  );
}
