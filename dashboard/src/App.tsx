import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Inspections } from './pages/Inspections';
import { Officers } from './pages/Officers';
import { ComplianceProvider } from './context/ComplianceContext';

function App() {
  return (
    <ComplianceProvider>
      <BrowserRouter basename="/LMPC-Scanner">
        <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inspections" element={<Inspections />} />
          <Route path="officers" element={<Officers />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </ComplianceProvider>
  );
}

export default App;
