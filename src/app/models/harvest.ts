import { Vegetable } from './vegetable';

export interface Harvest {
  id: string;
  vegetableName: string;
  quantity: number;
  unit: string;
  date: string; // ISO date string
  notes?: string;
  photo?: string; // Base64 data URL
}

export const DEFAULT_HARVESTS: Harvest[] = [];
