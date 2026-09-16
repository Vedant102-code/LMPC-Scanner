import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Inspections } from './pages/Inspections';
import { Officers } from './pages/Officers';
import { Login } from './pages/Login';
import { ComplianceProvider } from './context/ComplianceContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <ComplianceProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="violations" element={<div style={{padding:'20px'}}>Violations Page (Coming Soon)</div>} />
          <Route path="officers" element={<Officers />} />
          <Route path="settings" element={<div style={{padding:'20px'}}>Settings Page (Coming Soon)</div>} />
        </Route>
      </Routes>
      </BrowserRouter>
    </ComplianceProvider>
  );
}

export default App;
