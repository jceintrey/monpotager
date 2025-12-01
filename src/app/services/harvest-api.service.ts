import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type { Harvest } from '../models/harvest';

/**
 * Harvest API Service - 100% Neon Database
 * All data is stored and retrieved from the API/database
 * No localStorage fallback to avoid cache issues
 */
@Injectable({ providedIn: 'root' })
export class HarvestApiService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all harvests from API
   */
  async getAll(): Promise<Harvest[]> {
    const harvests = await this.apiService.getHarvests();
    // Convert API response to match local format
    return harvests.map((h) => ({
      ...h,
      id: String(h.id), // Convert number to string for consistency
    }));
  }

  /**
   * Add a new harvest
   */
  async add(harvest: Omit<Harvest, 'id'>): Promise<Harvest> {
    const result = await this.apiService.addHarvest(harvest);
    return {
      ...result,
      id: String(result.id),
    };
  }

  /**
   * Remove a harvest
   */
  async remove(id: string): Promise<Harvest[]> {
    await this.apiService.deleteHarvest(id);
    return await this.getAll();
  }

  /**
   * Get harvests for a specific vegetable
   */
  async getByVegetable(vegetableName: string): Promise<Harvest[]> {
    const all = await this.getAll();
    return all.filter(
      (h) => h.vegetableName.toLowerCase() === vegetableName.toLowerCase()
    );
  }

  /**
   * Get total quantity harvested for a vegetable
   */
  async getTotalByVegetable(vegetableName: string): Promise<number> {
    const harvests = await this.getByVegetable(vegetableName);
    return harvests.reduce((sum, h) => sum + h.quantity, 0);
  }
}
