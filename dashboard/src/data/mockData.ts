export const mockComplianceData = {
  nationalStats: {
    totalInspections: 12450,
    compliant: 8200,
    nonCompliant: 4250,
    criticalViolations: 850,
  },
  trendData: [
    { month: 'Jan', complianceRate: 65, violations: 1200 },
    { month: 'Feb', complianceRate: 68, violations: 1100 },
    { month: 'Mar', complianceRate: 66, violations: 1150 },
    { month: 'Apr', complianceRate: 72, violations: 950 },
    { month: 'May', complianceRate: 75, violations: 800 },
    { month: 'Jun', complianceRate: 78, violations: 700 },
  ],
  violationTypes: [
    { name: 'MRP Missing', value: 450 },
    { name: 'Net Qty Incorrect', value: 300 },
    { name: 'Mfg Date Missing', value: 200 },
    { name: 'Language Not Hindi/Eng', value: 150 },
    { name: 'Importer Address', value: 100 },
  ],
  districtData: {
    "Delhi": {
      "Central Delhi": [
        { pincode: "110001", total: 450, compliant: 300, violations: 150 },
        { pincode: "110002", total: 320, compliant: 250, violations: 70 },
        { pincode: "110005", total: 210, compliant: 180, violations: 30 },
      ],
      "South Delhi": [
        { pincode: "110016", total: 500, compliant: 400, violations: 100 },
        { pincode: "110017", total: 600, compliant: 450, violations: 150 },
      ]
    }
  },
  recentInspections: [
    { id: 'INS-2026-0901', product: 'Britannia Good Day', manufacturer: 'Britannia Ind.', status: 'Pending Review', severity: 'Critical', date: '2026-09-15' },
    { id: 'INS-2026-0902', product: 'Parle-G', manufacturer: 'Parle Products', status: 'Compliant', severity: 'None', date: '2026-09-14' },
    { id: 'INS-2026-0903', product: 'Dove Soap', manufacturer: 'HUL', status: 'Action Taken', severity: 'Major', date: '2026-09-14' },
    { id: 'INS-2026-0904', product: 'Maggi Noodles', manufacturer: 'Nestle', status: 'Under Investigation', severity: 'Minor', date: '2026-09-13' },
    { id: 'INS-2026-0905', product: 'Haldiram Bhujia', manufacturer: 'Haldiram', status: 'Compliant', severity: 'None', date: '2026-09-12' },
  ],
  mapMarkers: [
    { name: "New Delhi", coordinates: [77.2090, 28.6139], violations: 450 },
    { name: "Mumbai", coordinates: [72.8777, 19.0760], violations: 320 },
    { name: "Bengaluru", coordinates: [77.5946, 12.9716], violations: 210 },
    { name: "Chennai", coordinates: [80.2707, 13.0827], violations: 150 },
    { name: "Kolkata", coordinates: [88.3639, 22.5726], violations: 180 },
  ],
  fieldOfficers: [
    { id: 'OFF-101', name: 'Rajesh Kumar', region: 'Delhi', totalInspections: 145, recentInspectionIds: ['INS-2026-0901', 'INS-2026-0902'] },
    { id: 'OFF-102', name: 'Priya Sharma', region: 'Mumbai', totalInspections: 89, recentInspectionIds: ['INS-2026-0903'] },
    { id: 'OFF-103', name: 'Amit Patel', region: 'Gujarat', totalInspections: 210, recentInspectionIds: ['INS-2026-0904', 'INS-2026-0905'] },
    { id: 'OFF-104', name: 'Suresh Reddy', region: 'Andhra Pradesh', totalInspections: 67, recentInspectionIds: [] },
    { id: 'OFF-105', name: 'Anita Desai', region: 'Karnataka', totalInspections: 112, recentInspectionIds: ['INS-2026-0899'] },
  ]
};
