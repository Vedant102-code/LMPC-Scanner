import React, { createContext, useContext, useState, useEffect } from 'react';
import { simulateViolation } from '../services/violationSimulator';
import type { ViolationEvent } from '../services/violationSimulator';

interface ComplianceState {
  heatmapData: Record<string, number>;
  liveViolations: ViolationEvent[];
  addViolation: (v: ViolationEvent) => void;
  setAllData: (violations: ViolationEvent[], heatmap: Record<string, number>) => void;
}

const ComplianceContext = createContext<ComplianceState | null>(null);

export const ComplianceProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [liveViolations, setLiveViolations] = useState<ViolationEvent[]>([]);

  useEffect(() => {
    // Initial heatmap mock data matching the intensity of the user's image
    const initialHeatmap = {
      "Uttar Pradesh": 150,
      "Maharashtra": 120,
      "Andhra Pradesh": 110,
      "Madhya Pradesh": 80,
      "NCT of Delhi": 100,
      "Gujarat": 60,
      "Rajasthan": 50,
      "Bihar": 45,
      "Karnataka": 40,
      "Tamil Nadu": 30,
    };
    setHeatmapData(initialHeatmap);

    // Populate initial static data-based violations
    const initialViolations = Array.from({ length: 15 }).map(() => simulateViolation());
    setLiveViolations(initialViolations);
  }, []);

  const addViolation = (newViolation: ViolationEvent) => {
    setHeatmapData(prev => ({
      ...prev,
      [newViolation.regionName]: (prev[newViolation.regionName] || 0) + 1
    }));
    setLiveViolations(prev => [newViolation, ...prev].slice(0, 50));
  };

  const setAllData = (violations: ViolationEvent[], heatmap: Record<string, number>) => {
    setLiveViolations(violations);
    setHeatmapData(heatmap);
  };

  return (
    <ComplianceContext.Provider value={{ heatmapData, liveViolations, addViolation, setAllData }}>
      {children}
    </ComplianceContext.Provider>
  );
};

export const useCompliance = () => {
  const ctx = useContext(ComplianceContext);
  if (!ctx) throw new Error("useCompliance must be used within ComplianceProvider");
  return ctx;
};
