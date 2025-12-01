import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  CalendarEntry,
  Climate,
  SowingType,
  UserSettings,
  CreateCalendarOverrideDTO,
  UpdateUserSettingsDTO,
} from '../models/calendar';

// Determine API base URL (local dev or production)
const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8888/api'
    : '/api';

@Injectable({ providedIn: 'root' })
export class CalendarApiService {
  private readonly userId = 'default_user'; // For future multi-user support

  constructor(private http: HttpClient) {}

  // ============================================
  // CLIMATES
  // ============================================

  /**
   * Get all available climates
   */
  async getClimates(): Promise<Climate[]> {
    return firstValueFrom(
      this.http.get<Climate[]>(`${API_BASE_URL}/climates`)
    );
  }

  // ============================================
  // SOWING TYPES
  // ============================================

  /**
   * Get all sowing types
   */
  async getSowingTypes(): Promise<SowingType[]> {
    return firstValueFrom(
      this.http.get<SowingType[]>(`${API_BASE_URL}/sowing-types`)
    );
  }

  // ============================================
  // CALENDAR ENTRIES
  // ============================================

  /**
   * Get all calendar entries (defaults + user overrides)
   * @param filters Optional filters
   */
  async getCalendarEntries(filters?: {
    vegetable?: string;
    climate_id?: number;
  }): Promise<CalendarEntry[]> {
    let params = new HttpParams().set('user_id', this.userId);

    if (filters?.vegetable) {
      params = params.set('vegetable', filters.vegetable);
    }
    if (filters?.climate_id) {
      params = params.set('climate_id', filters.climate_id.toString());
    }

    return firstValueFrom(
      this.http.get<CalendarEntry[]>(`${API_BASE_URL}/calendar`, { params })
    );
  }

  /**
   * Get calendar entries for a specific vegetable
   */
  async getCalendarByVegetable(vegetableName: string): Promise<CalendarEntry[]> {
    return this.getCalendarEntries({ vegetable: vegetableName });
  }

  /**
   * Create a user calendar override
   */
  async createCalendarOverride(
    data: CreateCalendarOverrideDTO
  ): Promise<CalendarEntry> {
    const body = {
      ...data,
      user_id: this.userId,
    };

    return firstValueFrom(
      this.http.post<CalendarEntry>(`${API_BASE_URL}/calendar`, body)
    );
  }

  /**
   * Update a user calendar override
   */
  async updateCalendarOverride(
    id: number,
    data: Partial<CreateCalendarOverrideDTO>
  ): Promise<CalendarEntry> {
    return firstValueFrom(
      this.http.put<CalendarEntry>(`${API_BASE_URL}/calendar/${id}`, data)
    );
  }

  /**
   * Delete a user calendar override
   */
  async deleteCalendarOverride(id: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${API_BASE_URL}/calendar/${id}`)
    );
  }

  /**
   * Toggle calendar entry active status
   */
  async toggleCalendarEntry(id: number, isActive: boolean): Promise<CalendarEntry> {
    return this.updateCalendarOverride(id, { is_active: isActive } as any);
  }

  // ============================================
  // USER SETTINGS
  // ============================================

  /**
   * Get user settings (climate preference, etc.)
   */
  async getUserSettings(): Promise<UserSettings> {
    const params = new HttpParams().set('user_id', this.userId);

    return firstValueFrom(
      this.http.get<UserSettings>(`${API_BASE_URL}/user-settings`, { params })
    );
  }

  /**
   * Update user settings
   */
  async updateUserSettings(data: UpdateUserSettingsDTO): Promise<UserSettings> {
    const params = new HttpParams().set('user_id', this.userId);

    return firstValueFrom(
      this.http.put<UserSettings>(`${API_BASE_URL}/user-settings`, data, {
        params,
      })
    );
  }

  /**
   * Update user climate preference
   */
  async updateUserClimate(climateId: number): Promise<UserSettings> {
    return this.updateUserSettings({ climate_id: climateId });
  }
}
