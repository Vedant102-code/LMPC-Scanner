import { useState, useEffect, useRef } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { useReactToPrint } from 'react-to-print';
import { InspectionReportTemplate } from '../components/InspectionReportTemplate';

export function Inspections() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);
  
  const handlePrintPDF = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `LMPC_Inspection_${selectedCase?.id || 'Report'}`,
  });

  const handleExportWord = () => {
    if (!reportRef.current) return;
    
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>LMPC Inspection Report</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + reportRef.current.innerHTML + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `LMPC_Inspection_${selectedCase?.id || 'Report'}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  useEffect(() => {
    fetch('http://10.218.218.119:8000/api/inspections')
      .then(res => res.json())
      .then(data => setInspections(data.inspections || []))
      .catch(e => console.error(e));
  }, []);

  const openReview = (id: string) => {
    fetch(`http://10.218.218.119:8000/api/inspections/${id}`)
      .then(res => res.json())
      .then(data => setSelectedCase(data))
      .catch(e => console.error("Failed to load details", e));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Inspections & Case Workflow</h1>
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
                    <button onClick={() => openReview(inspection.id)} style={{ color: 'var(--accent-color)', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer' }}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Report Template for Printing/Exporting */}
      <div style={{ display: 'none' }}>
        <InspectionReportTemplate ref={reportRef} caseData={selectedCase} />
      </div>

      {/* Case Review Modal */}
      {selectedCase && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', width: '80%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Case Detail: {selectedCase.id}</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button onClick={handleExportWord} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Export as Word (.doc)
                </button>
                <button onClick={() => handlePrintPDF()} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Generate Locked PDF
                </button>
                <button onClick={() => setSelectedCase(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-primary)', marginLeft: '10px' }}>&times;</button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Physical Evidence</h3>
                {selectedCase.images && selectedCase.images.length > 0 ? (
                  selectedCase.images.map((img: str, i: number) => (
                     <img key={i} src={`http://10.218.218.119:8000${img}`} alt="Evidence" style={{ width: '100%', borderRadius: '4px', marginBottom: '8px' }} />
                  ))
                ) : (
                  <div style={{ width: '100%', height: '200px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>No Evidence Images Uploaded</div>
                )}
                
                <h3 style={{ fontSize: '1.1rem', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Raw AI Extraction (JSON)</h3>
                <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '12px', borderRadius: '4px', overflowX: 'auto', fontSize: '0.8rem' }}>
                  {selectedCase.raw_json ? JSON.stringify(JSON.parse(selectedCase.raw_json), null, 2) : 'No JSON Data available'}
                </pre>
              </div>
              
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>AI Compliance Breakdown</h3>
                <p><strong>Brand:</strong> {selectedCase.brand}</p>
                <p><strong>Product:</strong> {selectedCase.product}</p>
                <p><strong>Location:</strong> {selectedCase.address}</p>
                <p><strong>Score:</strong> {selectedCase.score}%</p>
                
                <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Rule</th>
                      <th style={{ padding: '8px' }}>Status</th>
                      <th style={{ padding: '8px' }}>AI Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCase.checks && selectedCase.checks.map((check: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px', fontSize: '0.9rem' }}>{check.rule}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ color: check.status === 'PASS' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{check.status}</span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          {check.confidence ? `${(check.confidence * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
