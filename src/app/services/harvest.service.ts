import { Injectable } from '@angular/core';
import { Harvest, DEFAULT_HARVESTS } from '../models/harvest';

@Injectable({
  providedIn: 'root',
})
export class HarvestService {
  private readonly STORAGE_KEY = 'monpotager.harvests.v1';

  getAll(): Harvest[] {
    try {
      const storedHarvests = localStorage.getItem(this.STORAGE_KEY);
      if (storedHarvests) {
        return JSON.parse(storedHarvests);
      }
      return DEFAULT_HARVESTS;
    } catch {
      return DEFAULT_HARVESTS;
    }
  }

  findById(id: string): Harvest | undefined {
    const harvests = this.getAll();
    return harvests.find((h) => h.id === id);
  }

  add(harvest: Omit<Harvest, 'id'>): Harvest {
    const harvests = this.getAll();
    const newHarvest: Harvest = {
      ...harvest,
      id: this.generateId(),
    };
    harvests.push(newHarvest);
    this.save(harvests);
    return newHarvest;
  }

  remove(id: string): void {
    const harvests = this.getAll();
    const filtered = harvests.filter((h) => h.id !== id);
    this.save(filtered);
  }

  clear(): void {
    this.save(DEFAULT_HARVESTS);
  }

  getByVegetable(vegetableName: string): Harvest[] {
    const harvests = this.getAll();
    return harvests.filter(
      (h) => h.vegetableName.toLowerCase() === vegetableName.toLowerCase()
    );
  }

  getTotalByVegetable(vegetableName: string): number {
    const harvests = this.getByVegetable(vegetableName);
    return harvests.reduce((sum, h) => sum + h.quantity, 0);
  }

  private save(harvests: Harvest[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(harvests));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
