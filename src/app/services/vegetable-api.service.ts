import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type { Vegetable } from '../models/vegetable';

/**
 * Vegetable API Service - 100% Neon Database
 * All data is stored and retrieved from the API/database
 * No localStorage fallback to avoid cache issues
 */
@Injectable({ providedIn: 'root' })
export class VegetableApiService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all vegetables from API
   */
  async getAll(): Promise<Vegetable[]> {
    return await this.apiService.getVegetables();
  }

  /**
   * Find vegetable by name
   */
  async findByName(name: string): Promise<Vegetable | undefined> {
    const all = await this.getAll();
    return all.find((v) => v.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Add a new vegetable
   */
  async add(veg: Vegetable): Promise<Vegetable[]> {
    await this.apiService.addVegetable(veg);
    return await this.getAll();
  }

  /**
   * Remove a vegetable
   */
  async remove(veg: Vegetable): Promise<Vegetable[]> {
    await this.apiService.deleteVegetable(veg);
    return await this.getAll();
  }
}
