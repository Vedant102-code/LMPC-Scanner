import { useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';

export function Inspections() {
  const [inspections, setInspections] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://10.218.218.119:8000/api/inspections')
      .then(res => res.json())
      .then(data => setInspections(data.inspections || []))
      .catch(e => console.error(e));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Inspections & Case Workflow</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="Search inspections..." 
            style={{ padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
          />
          <button className="badge badge-neutral" style={{ padding: '8px 16px', border: '1px solid var(--border-color)' }}>Filter</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inspection ID</th>
                <th>Product Name</th>
                <th>Manufacturer/Brand</th>
                <th>Status Pipeline</th>
                <th>Compliance Score</th>
                <th>Scan Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td style={{ color: 'var(--accent-color)', fontWeight: 500 }}>{inspection.id}</td>
                  <td>{inspection.product}</td>
                  <td>{inspection.brand}</td>
                  <td><StatusBadge status={inspection.is_compliant ? 'Verified' : 'Pending Review'} /></td>
                  <td><StatusBadge status={inspection.score > 80 ? 'High' : (inspection.score > 50 ? 'Medium' : 'Critical')} type="severity" /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inspection.date}</td>
                  <td>
                    <button style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 500, paddingRight: '8px' }}>Review</button>
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>Loading real-time inspections...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
