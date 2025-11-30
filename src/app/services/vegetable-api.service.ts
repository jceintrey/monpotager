import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type { Vegetable } from '../models/vegetable';
import { DEFAULT_VEGETABLES } from '../models/vegetable';

const STORAGE_KEY = 'monpotager.vegetables.v1';
const USE_API_KEY = 'monpotager.use.api';

function readStorage(): Vegetable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_VEGETABLES];
    const parsed = JSON.parse(raw) as Vegetable[];
    return parsed;
  } catch (e) {
    console.error('Failed to read vegetable storage', e);
    return [...DEFAULT_VEGETABLES];
  }
}

function writeStorage(items: Vegetable[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

@Injectable({ providedIn: 'root' })
export class VegetableApiService {
  private useApi: boolean = false;

  constructor(private apiService: ApiService) {
    // Auto-detect: use API in production (netlify.app), localStorage in development (localhost)
    const isProduction = window.location.hostname.includes('netlify.app');
    this.useApi = isProduction || localStorage.getItem(USE_API_KEY) === 'true';
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

  async getAll(): Promise<Vegetable[]> {
    if (this.useApi) {
      try {
        return await this.apiService.getVegetables();
      } catch (error) {
        console.error('API failed, falling back to localStorage:', error);
        return readStorage();
      }
    }
    return readStorage();
  }

  async findByName(name: string): Promise<Vegetable | undefined> {
    const all = await this.getAll();
    return all.find((v) => v.name.toLowerCase() === name.toLowerCase());
  }

  private getKey(veg: Vegetable): string {
    const variety = veg.variety?.toLowerCase().trim() || '';
    return `${veg.name.toLowerCase().trim()}|${variety}`;
  }

  async add(veg: Vegetable): Promise<Vegetable[]> {
    if (this.useApi) {
      try {
        await this.apiService.addVegetable(veg);
        return await this.getAll();
      } catch (error) {
        console.error('API failed, falling back to localStorage:', error);
        // Fallback to localStorage
      }
    }

    // localStorage implementation
    const list = readStorage();
    const key = this.getKey(veg);
    const exists = list.find((v) => this.getKey(v) === key);
    if (!exists) list.push(veg);
    else Object.assign(exists, veg);
    writeStorage(list);
    return list;
  }

  async remove(veg: Vegetable): Promise<Vegetable[]> {
    if (this.useApi) {
      try {
        await this.apiService.deleteVegetable(veg);
        return await this.getAll();
      } catch (error) {
        console.error('API failed, falling back to localStorage:', error);
        // Fallback to localStorage
      }
    }

    // localStorage implementation
    const key = this.getKey(veg);
    const list = readStorage().filter((v) => this.getKey(v) !== key);
    writeStorage(list);
    return list;
  }

  clear() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}
