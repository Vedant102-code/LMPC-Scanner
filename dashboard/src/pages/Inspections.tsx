import { mockComplianceData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';

export function Inspections() {
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
                <th>Manufacturer</th>
                <th>Status Pipeline</th>
                <th>AI Severity</th>
                <th>Scan Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockComplianceData.recentInspections.map((inspection) => (
                <tr key={inspection.id}>
                  <td style={{ color: 'var(--accent-color)', fontWeight: 500 }}>{inspection.id}</td>
                  <td>{inspection.product}</td>
                  <td>{inspection.manufacturer}</td>
                  <td><StatusBadge status={inspection.status} /></td>
                  <td><StatusBadge status={inspection.severity} type="severity" /></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{inspection.date}</td>
                  <td>
                    <button style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 500, paddingRight: '8px' }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
