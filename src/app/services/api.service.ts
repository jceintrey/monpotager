import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import type { Vegetable } from '../models/vegetable';
import type { Harvest } from '../models/harvest';

// Determine API base URL (local dev or production)
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8888/api'
  : '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Vegetables API
  async getVegetables(): Promise<Vegetable[]> {
    return firstValueFrom(
      this.http.get<Vegetable[]>(`${API_BASE_URL}/vegetables`)
    );
  }

  async addVegetable(vegetable: Vegetable): Promise<Vegetable> {
    return firstValueFrom(
      this.http.post<Vegetable>(`${API_BASE_URL}/vegetables`, vegetable)
    );
  }

  async deleteVegetable(vegetable: Vegetable): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${API_BASE_URL}/vegetables`, { body: vegetable })
    );
  }

  // Harvests API
  async getHarvests(): Promise<Harvest[]> {
    return firstValueFrom(
      this.http.get<Harvest[]>(`${API_BASE_URL}/harvests`)
    );
  }

  async addHarvest(harvest: Omit<Harvest, 'id'>): Promise<Harvest> {
    return firstValueFrom(
      this.http.post<Harvest>(`${API_BASE_URL}/harvests`, harvest)
    );
  }

  async deleteHarvest(id: string | number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${API_BASE_URL}/harvests/${id}`)
    );
  }
}
