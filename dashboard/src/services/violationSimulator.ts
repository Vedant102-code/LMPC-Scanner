export interface ViolationEvent {
  id: string;
  rule: string;
  regionId: string;
  regionName: string;
  coordinates: [number, number];
  timestamp: Date;
}

const regions = [
  { name: "Uttar Pradesh", coords: [80.9462, 26.8467] },
  { name: "Maharashtra", coords: [75.7139, 19.7515] },
  { name: "Andhra Pradesh", coords: [79.7400, 15.9129] },
  { name: "NCT of Delhi", coords: [77.2090, 28.6139] },
  { name: "Karnataka", coords: [75.7139, 15.3173] },
  { name: "Gujarat", coords: [71.1924, 22.2587] },
  { name: "Rajasthan", coords: [74.2179, 27.0238] },
  { name: "Bihar", coords: [85.3131, 25.0961] },
  { name: "Tamil Nadu", coords: [78.6569, 11.1271] },
  { name: "West Bengal", coords: [87.8550, 22.9868] }
];

const rules = [
  "Rule 6: MRP Missing",
  "Rule 18: Net Quantity Mismatch",
  "Rule 9: Mfd Date Missing",
  "Rule 4: Language Not Standard",
  "Rule 10: Importer Address Missing"
];

export const simulateViolation = (): ViolationEvent => {
  const region = regions[Math.floor(Math.random() * regions.length)];
  const rule = rules[Math.floor(Math.random() * rules.length)];
  
  // Add slight random jitter to coordinates so dots don't stack exactly on the same pixel
  const jitterX = (Math.random() - 0.5) * 2;
  const jitterY = (Math.random() - 0.5) * 2;
  
  return {
    id: `V-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    rule,
    regionId: region.name,
    regionName: region.name,
    coordinates: [region.coords[0] + jitterX, region.coords[1] + jitterY],
    timestamp: new Date()
  };
};
