import { Injectable } from '@angular/core';
import type { Vegetable } from '../models/vegetable';
import { DEFAULT_VEGETABLES } from '../models/vegetable';

const STORAGE_KEY = 'monpotager.vegetables.v1';

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
export class VegetableService {
  getAll(): Vegetable[] {
    return readStorage();
  }

  findByName(name: string): Vegetable | undefined {
    return this.getAll().find((v) => v.name.toLowerCase() === name.toLowerCase());
  }

  // Create unique key from name and variety
  private getKey(veg: Vegetable): string {
    const variety = veg.variety?.toLowerCase().trim() || '';
    return `${veg.name.toLowerCase().trim()}|${variety}`;
  }

  add(veg: Vegetable): Vegetable[] {
    const list = this.getAll();
    const key = this.getKey(veg);
    const exists = list.find((v) => this.getKey(v) === key);
    if (!exists) list.push(veg);
    else Object.assign(exists, veg);
    writeStorage(list);
    return list;
  }

  remove(veg: Vegetable): Vegetable[] {
    const key = this.getKey(veg);
    const list = this.getAll().filter((v) => this.getKey(v) !== key);
    writeStorage(list);
    return list;
  }

  clear() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}
