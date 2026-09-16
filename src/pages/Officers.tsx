import { mockComplianceData } from '../data/mockData';
import { Search } from 'lucide-react';

export function Officers() {

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Field Officers Performance</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search officers..." 
              style={{ padding: '8px 12px 8px 36px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
            />
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          </div>
          <button className="badge badge-neutral" style={{ padding: '8px 16px', border: '1px solid var(--border-color)' }}>Export CSV</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Officer ID</th>
                <th>Name</th>
                <th>Region</th>
                <th>Total Inspections</th>
                <th>Recent Inspection IDs</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {mockComplianceData.fieldOfficers.map((officer) => (
                <tr key={officer.id}>
                  <td style={{ fontWeight: 500 }}>{officer.id}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{officer.name}</td>
                  <td>{officer.region}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{officer.totalInspections.toLocaleString()}</td>
                  <td>
                    {officer.recentInspectionIds.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {officer.recentInspectionIds.map(id => (
                          <span key={id} style={{ fontSize: '12px', padding: '2px 8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                            {id}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No recent scans</span>
                    )}
                  </td>
                  <td>
                    <div style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (officer.totalInspections / 200) * 100)}%`, backgroundColor: 'var(--success)', height: '100%' }}></div>
                    </div>
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
