import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type { Harvest } from '../models/harvest';

const STORAGE_KEY = 'monpotager.harvests.v1';
const USE_API_KEY = 'monpotager.use.api';

function readStorage(): Harvest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Harvest[];
  } catch (e) {
    console.error('Failed to read harvests storage', e);
    return [];
  }
}

function writeStorage(items: Harvest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

@Injectable({ providedIn: 'root' })
export class HarvestApiService {
  private useApi: boolean = false;

  constructor(private apiService: ApiService) {
    // Check if we should use API
    this.useApi = localStorage.getItem(USE_API_KEY) === 'true';
  }

  /**
   * Enable API mode (after successful migration)
   */
  enableApiMode(): void {
    this.useApi = true;
    localStorage.setItem(USE_API_KEY, 'true');
  }

  /**
   * Disable API mode (fallback to localStorage)
   */
  disableApiMode(): void {
    this.useApi = false;
    localStorage.removeItem(USE_API_KEY);
  }

  async getAll(): Promise<Harvest[]> {
    if (this.useApi) {
      try {
        const harvests = await this.apiService.getHarvests();
        // Convert API response to match local format
        return harvests.map(h => ({
          ...h,
          id: String(h.id), // Convert number to string for consistency
        }));
      } catch (error) {
        console.error('API failed, falling back to localStorage:', error);
        return readStorage();
      }
    }
    return readStorage();
  }

  async add(harvest: Omit<Harvest, 'id'>): Promise<Harvest> {
    if (this.useApi) {
      try {
        const result = await this.apiService.addHarvest(harvest);
        return {
          ...result,
          id: String(result.id),
        };
      } catch (error) {
        console.error('API failed, falling back to localStorage:', error);
        // Fallback to localStorage
      }
    }

    // localStorage implementation
    const harvests = readStorage();
    const newHarvest: Harvest = {
      ...harvest,
      id: generateId(),
    };
    harvests.push(newHarvest);
    writeStorage(harvests);
    return newHarvest;
  }

  async remove(id: string): Promise<Harvest[]> {
    if (this.useApi) {
      try {
        await this.apiService.deleteHarvest(id);
        return await this.getAll();
      } catch (error) {
        console.error('API failed, falling back to localStorage:', error);
        // Fallback to localStorage
      }
    }

    // localStorage implementation
    const harvests = readStorage().filter((h) => h.id !== id);
    writeStorage(harvests);
    return harvests;
  }

  async getByVegetable(vegetableName: string): Promise<Harvest[]> {
    const all = await this.getAll();
    return all.filter(
      (h) => h.vegetableName.toLowerCase() === vegetableName.toLowerCase()
    );
  }

  async getTotalByVegetable(vegetableName: string): Promise<number> {
    const harvests = await this.getByVegetable(vegetableName);
    return harvests.reduce((sum, h) => sum + h.quantity, 0);
  }

  clear() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}
