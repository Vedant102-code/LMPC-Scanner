import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompliance } from '../context/ComplianceContext';
import { Camera, Upload, AlertCircle, CheckCircle, ArrowRight, Loader2, ScanLine } from 'lucide-react';

export function MobileScanner() {
  const navigate = useNavigate();
  const { addViolation } = useCompliance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [status, setStatus] = useState<'idle' | 'scanning' | 'result'>('idle');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        startScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const startScan = () => {
    setStatus('scanning');
    
    // Simulate AI Processing time
    setTimeout(() => {
      setStatus('result');
      
      // Inject a new violation into the global state
      addViolation({
        id: `V-LIVE-${Date.now()}`,
        rule: "Rule 6: MRP Missing (Detected from Scan)",
        regionId: "NCT of Delhi",
        regionName: "NCT of Delhi",
        coordinates: [77.2090, 28.6139], // Delhi
        timestamp: new Date()
      });
      
    }, 3000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      {/* Mobile Frame Container */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        height: '800px',
        maxHeight: '90vh',
        backgroundColor: '#1f2937',
        borderRadius: '32px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '8px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* App Header */}
        <div style={{ padding: '24px 20px 16px', backgroundColor: '#3b82f6', color: 'white', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>LMPC Field Scanner</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.8 }}>AI Compliance Engine</p>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          
          {status === 'idle' && (
            <>
              <div 
                onClick={triggerUpload}
                style={{
                  width: '200px', height: '200px', borderRadius: '50%', border: '2px dashed #4b5563',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', backgroundColor: '#374151', color: '#9ca3af',
                  transition: 'all 0.2s'
                }}
              >
                <Camera size={48} style={{ marginBottom: '16px' }} />
                <span style={{ fontWeight: 500 }}>Tap to Scan</span>
              </div>
              <p style={{ marginTop: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', lineHeight: '1.5' }}>
                Capture an image of the packaged commodity to instantly verify LMPC compliance.
              </p>
            </>
          )}

          {status === 'scanning' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #3b82f6' }}>
                <img src={imagePreview!} alt="Scanning" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: '#3b82f6',
                  boxShadow: '0 0 10px #3b82f6',
                  animation: 'scan 1.5s infinite linear'
                }} />
              </div>
              
              <style>{`
                @keyframes scan {
                  0% { top: 0%; }
                  50% { top: 100%; }
                  100% { top: 0%; }
                }
              `}</style>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px', color: '#3b82f6' }}>
                <Loader2 className="animate-spin" size={24} />
                <span style={{ fontWeight: 600 }}>Analyzing Rules Engine...</span>
              </div>
            </div>
          )}

          {status === 'result' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                <AlertCircle size={40} color="#ef4444" />
              </div>
              
              <h3 style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Violation Detected</h3>
              <p style={{ color: '#d1d5db', textAlign: 'center', marginBottom: '32px', fontSize: '14px' }}>
                The AI engine has detected a critical infraction on the scanned package.
              </p>
              
              <div style={{ backgroundColor: '#374151', width: '100%', padding: '16px', borderRadius: '12px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #4b5563', paddingBottom: '12px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Rule Violated</span>
                  <span style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '13px' }}>Rule 6: MRP Missing</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #4b5563', paddingBottom: '12px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Location</span>
                  <span style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '13px' }}>NCT of Delhi (GPS)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Confidence Score</span>
                  <span style={{ color: '#10b981', fontWeight: 600, fontSize: '13px' }}>98.4%</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/')}
                style={{
                  width: '100%', padding: '16px', backgroundColor: '#3b82f6', color: 'white', border: 'none',
                  borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                }}
              >
                Go to Executive Overview
                <ArrowRight size={20} />
              </button>
            </div>
          )}

        </div>
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageUpload}
        />
        
        {/* App Footer/Nav Bar Mock */}
        <div style={{ height: '60px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#1f2937' }}>
          <ScanLine size={24} color="#3b82f6" />
          <Upload size={24} color="#6b7280" />
          <CheckCircle size={24} color="#6b7280" />
        </div>
      </div>
    </div>
  );
}
