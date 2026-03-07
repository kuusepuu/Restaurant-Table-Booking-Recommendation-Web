export type Zone = 'MAIN_HALL' | 'WINDOW' | 'PRIVATE' | 'PATIO';

export interface RestaurantTable {
  id: number;
  label: string;        // "T1", "W3"
  capacity: number;     // 2, 4, 6, 8
  zone: Zone;
  accessible: boolean;  // wheelchair accessible
  gridX: number;        // column position
  gridY: number;        // row position
}

export interface TableRecommendation {
  table: RestaurantTable;
  score: number;
  reasons: string[];
}

export interface SearchCriteria {
  date: string;              // "2026-03-15" (ISO format)
  startTime: string;         // "18:30"
  durationMinutes: number;
  groupSize: number;
  preferredZones: Zone[];
  needsAccessible: boolean;
}

