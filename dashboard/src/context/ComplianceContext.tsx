import React, { createContext, useContext, useState, useEffect } from 'react';
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
    // Initial heatmap mock data for regions without data yet
    const initialHeatmap: Record<string, number> = {
      "Uttar Pradesh": 150, "Maharashtra": 120, "NCT of Delhi": 100,
    };

    const fetchLiveInspections = async () => {
      try {
        const response = await fetch('https://lmpc-scanner.onrender.com/api/inspections');
        const data = await response.json();
        
        const violations: ViolationEvent[] = [];
        const heatmap = { ...initialHeatmap };

        data.inspections.forEach((insp: any) => {
          // Add region to heatmap
          let region = insp.address;
          heatmap[region] = (heatmap[region] || 0) + 1;

          // For every failed rule, create a map dot
          insp.failed_rules.forEach((rule: string) => {
            let lat = 20.0, lon = 78.0;
            if (insp.locationGps) {
              const coords = insp.locationGps.split(',');
              if (coords.length === 2) {
                lat = parseFloat(coords[0].trim());
                lon = parseFloat(coords[1].trim());
              }
            }

            // Jitter to prevent exact overlap
            const jitterX = (Math.random() - 0.5) * 0.5;
            const jitterY = (Math.random() - 0.5) * 0.5;

            violations.push({
              id: insp.id,
              rule: rule,
              regionId: region,
              regionName: region,
              coordinates: [lon + jitterX, lat + jitterY], // Longitude, Latitude for map
              timestamp: new Date(insp.date)
            });
          });
        });

        setHeatmapData(heatmap);
        setLiveViolations(violations);
      } catch (e) {
        console.error("Failed to fetch from backend", e);
      }
    };

    fetchLiveInspections();
    const interval = setInterval(fetchLiveInspections, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
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
