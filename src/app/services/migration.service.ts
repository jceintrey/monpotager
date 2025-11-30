import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import type { Vegetable } from '../models/vegetable';
import type { Harvest } from '../models/harvest';

const VEGETABLES_STORAGE_KEY = 'monpotager.vegetables.v1';
const HARVESTS_STORAGE_KEY = 'monpotager.harvests.v1';
const MIGRATION_STATUS_KEY = 'monpotager.migration.status';

export interface MigrationResult {
  success: boolean;
  vegetablesMigrated: number;
  harvestsMigrated: number;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class MigrationService {
  constructor(private apiService: ApiService) {}

  /**
   * Check if migration has already been completed
   */
  isMigrationCompleted(): boolean {
    return localStorage.getItem(MIGRATION_STATUS_KEY) === 'completed';
  }

  /**
   * Mark migration as completed
   */
  private markMigrationCompleted(): void {
    localStorage.setItem(MIGRATION_STATUS_KEY, 'completed');
  }

  /**
   * Get localStorage data
   */
  private getLocalStorageData(): { vegetables: Vegetable[]; harvests: Harvest[] } {
    const vegetables: Vegetable[] = [];
    const harvests: Harvest[] = [];

    try {
      const vegRaw = localStorage.getItem(VEGETABLES_STORAGE_KEY);
      if (vegRaw) {
        vegetables.push(...JSON.parse(vegRaw));
      }
    } catch (e) {
      console.error('Error reading vegetables from localStorage:', e);
    }

    try {
      const harvestsRaw = localStorage.getItem(HARVESTS_STORAGE_KEY);
      if (harvestsRaw) {
        harvests.push(...JSON.parse(harvestsRaw));
      }
    } catch (e) {
      console.error('Error reading harvests from localStorage:', e);
    }

    return { vegetables, harvests };
  }

  /**
   * Check if there is data to migrate
   */
  hasDataToMigrate(): boolean {
    const { vegetables, harvests } = this.getLocalStorageData();
    return vegetables.length > 0 || harvests.length > 0;
  }

  /**
   * Migrate localStorage data to Neon database
   */
  async migrateToNeon(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      vegetablesMigrated: 0,
      harvestsMigrated: 0,
      errors: [],
    };

    const { vegetables, harvests } = this.getLocalStorageData();

    console.log(`Starting migration: ${vegetables.length} vegetables, ${harvests.length} harvests`);

    // Migrate vegetables first
    for (const vegetable of vegetables) {
      try {
        await this.apiService.addVegetable(vegetable);
        result.vegetablesMigrated++;
      } catch (error) {
        const errorMsg = `Failed to migrate vegetable "${vegetable.name}": ${(error as Error).message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // Migrate harvests
    for (const harvest of harvests) {
      try {
        // Convert localStorage harvest format to API format
        const harvestData = {
          vegetableName: harvest.vegetableName,
          quantity: harvest.quantity,
          unit: harvest.unit,
          date: harvest.date,
          notes: harvest.notes,
          photo: harvest.photo,
        };
        await this.apiService.addHarvest(harvestData);
        result.harvestsMigrated++;
      } catch (error) {
        const errorMsg = `Failed to migrate harvest for "${harvest.vegetableName}": ${(error as Error).message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    // Mark as successful if at least some data was migrated
    result.success = result.vegetablesMigrated > 0 || result.harvestsMigrated > 0;

    if (result.success) {
      this.markMigrationCompleted();
      console.log('Migration completed successfully:', result);
    }

    return result;
  }

  /**
   * Clear localStorage data after successful migration
   */
  clearLocalStorageData(): void {
    localStorage.removeItem(VEGETABLES_STORAGE_KEY);
    localStorage.removeItem(HARVESTS_STORAGE_KEY);
    console.log('localStorage data cleared');
  }

  /**
   * Reset migration status (for testing)
   */
  resetMigrationStatus(): void {
    localStorage.removeItem(MIGRATION_STATUS_KEY);
  }
}
