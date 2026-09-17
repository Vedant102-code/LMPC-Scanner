import { forwardRef } from 'react';

interface ReportProps {
  caseData: any;
}

export const InspectionReportTemplate = forwardRef<HTMLDivElement, ReportProps>(({ caseData }, ref) => {
  if (!caseData) return null;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div ref={ref} id="printable-report" style={{ padding: '60px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'serif', lineHeight: '1.6' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', margin: '0 0 10px 0', textTransform: 'uppercase', fontWeight: 'bold' }}>
          Government of India
        </h1>
        <h2 style={{ fontSize: '18px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>
          Department of Legal Metrology
        </h2>
        <h3 style={{ fontSize: '20px', margin: 0, textDecoration: 'underline', fontWeight: 'bold' }}>
          OFFICIAL INSPECTION REPORT
        </h3>
      </div>

      {/* Meta Information */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontWeight: 'bold' }}>
        <div>
          <p style={{ margin: 0 }}>Report Ref No: {caseData.id}</p>
          <p style={{ margin: 0 }}>Place of Inspection: {caseData.address || "Unknown"}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>Date of Issue: {currentDate}</p>
          <p style={{ margin: 0 }}>Scan Date: {caseData.date}</p>
        </div>
      </div>

      {/* Entity Details */}
      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', backgroundColor: '#f9fafb' }}>
        <h4 style={{ margin: '0 0 10px 0', textDecoration: 'underline' }}>Entity Details</h4>
        <p style={{ margin: '5px 0' }}><strong>Brand / Manufacturer:</strong> {caseData.brand || "Unknown Brand"}</p>
        <p style={{ margin: '5px 0' }}><strong>Product Name:</strong> {caseData.product || "Unknown Product"}</p>
        <p style={{ margin: '5px 0' }}>
          <strong>Overall Compliance Status:</strong> 
          <span style={{ color: caseData.is_compliant ? '#10b981' : '#ef4444', fontWeight: 'bold', marginLeft: '5px' }}>
            {caseData.is_compliant ? "COMPLIANT (VERIFIED)" : "NON-COMPLIANT (INFRACTIONS DETECTED)"}
          </span>
        </p>
        <p style={{ margin: '5px 0' }}><strong>AI Confidence Score:</strong> {caseData.score}%</p>
      </div>

      {/* Body */}
      <div style={{ marginBottom: '30px', textAlign: 'justify' }}>
        <p style={{ margin: '0 0 15px 0' }}>
          This report summarizes the findings of an automated computer-vision inspection conducted under the provisions of the <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>.
        </p>
        {!caseData.is_compliant ? (
          <p style={{ margin: '0 0 15px 0', color: '#ef4444', fontWeight: 'bold' }}>
            Notice: The inspected package does NOT conform to the mandatory declarations. The specific infractions are detailed below.
          </p>
        ) : (
          <p style={{ margin: '0 0 15px 0', color: '#10b981', fontWeight: 'bold' }}>
            Notice: The inspected package conforms to all mandatory declarations tested during this scan. No penal infractions were detected.
          </p>
        )}
      </div>

      {/* Violations/Checks Table */}
      <h4 style={{ margin: '0 0 10px 0', textDecoration: 'underline' }}>Detailed Rule Evaluation</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', border: '1px solid #000' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Rule Checked</th>
            <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Status</th>
            <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f3f4f6', textAlign: 'left' }}>Details / Reason</th>
            <th style={{ border: '1px solid #000', padding: '10px', backgroundColor: '#f3f4f6', textAlign: 'left' }}>AI Confidence</th>
          </tr>
        </thead>
        <tbody>
          {caseData.checks && caseData.checks.map((check: any, idx: number) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #000', padding: '10px', fontWeight: 'bold' }}>{check.rule}</td>
              <td style={{ border: '1px solid #000', padding: '10px', color: check.status === 'FAIL' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                {check.status}
              </td>
              <td style={{ border: '1px solid #000', padding: '10px' }}>
                {check.status === 'FAIL' ? (check.reason || "Field missing or improperly formatted.") : "Requirement met."}
              </td>
              <td style={{ border: '1px solid #000', padding: '10px' }}>
                {check.confidence ? `${(check.confidence * 100).toFixed(1)}%` : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '60px' }}>
        <div style={{ textAlign: 'center', width: '250px' }}>
          <div style={{ borderBottom: '1px dashed #000', height: '40px', marginBottom: '10px' }}></div>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Inspecting Officer</p>
          <p style={{ margin: 0 }}>Department of Legal Metrology</p>
        </div>
      </div>
      
      {/* Evidence Page Break */}
      <div style={{ pageBreakBefore: 'always', marginTop: '40px' }}></div>
      <h3 style={{ textAlign: 'center', textDecoration: 'underline', marginBottom: '30px' }}>ENCLOSURE: PHOTOGRAPHIC EVIDENCE</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {caseData.images && caseData.images.length > 0 ? (
          caseData.images.map((img: string, i: number) => (
             <div key={i} style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
                 <img 
                   src={`https://lmpc-scanner.onrender.com${img}`} 
                   alt="Evidence" 
                   onError={(e) => { 
                     const target = e.currentTarget as HTMLImageElement;
                     target.onerror = null; 
                     target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlMGUwZTAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM4ODgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBVbmF2YWlsYWJsZTwvdGV4dD48L3N2Zz4='; 
                   }}
                   style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} 
                 />
               <p style={{ marginTop: '10px', fontSize: '12px', fontWeight: 'bold' }}>Exhibit {i + 1}</p>
             </div>
          ))
        ) : (
          <p style={{ textAlign: 'center' }}>No physical evidence photos attached to this record.</p>
        )}
      </div>

    </div>
  );
});

InspectionReportTemplate.displayName = 'InspectionReportTemplate';
