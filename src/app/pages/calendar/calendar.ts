import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarApiService } from '../../services/calendar-api.service';
import {
  CalendarEntry,
  Climate,
  SowingType,
  UserSettings,
  MONTH_NAMES,
} from '../../models/calendar';
import {
  decadeToDisplay,
  formatPeriodRange,
  getAllMonthsWithDecades,
  isDecadeInRange,
} from '../../utils/calendar.utils';

interface CalendarCell {
  decade: number;
  entries: CalendarEntry[];
}

interface VegetableRow {
  vegetableName: string;
  cells: CalendarCell[];
  hasData: boolean;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export default class CalendarPage implements OnInit {
  // Data
  calendarEntries: CalendarEntry[] = [];
  climates: Climate[] = [];
  sowingTypes: SowingType[] = [];
  userSettings: UserSettings | null = null;

  // Filters
  selectedVegetables: string[] = [];
  selectedSowingTypes: number[] = [];
  searchQuery = '';

  // View state
  loading = true;
  error: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';

  // Calendar grid data
  months = getAllMonthsWithDecades();
  vegetableRows: VegetableRow[] = [];
  allVegetableNames: string[] = [];

  // Legend
  sowingColor = '#16a34a'; // green
  harvestColor = '#ea580c'; // orange

  constructor(private calendarApi: CalendarApiService) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Load all data in parallel
      const [entries, climates, sowingTypes, settings] = await Promise.all([
        this.calendarApi.getCalendarEntries(),
        this.calendarApi.getClimates(),
        this.calendarApi.getSowingTypes(),
        this.calendarApi.getUserSettings(),
      ]);

      this.calendarEntries = entries;
      this.climates = climates;
      this.sowingTypes = sowingTypes;
      this.userSettings = settings;

      // Extract unique vegetable names
      this.allVegetableNames = [
        ...new Set(entries.map((e) => e.vegetable_name)),
      ].sort();

      // Select all by default
      this.selectedVegetables = [...this.allVegetableNames];
      this.selectedSowingTypes = this.sowingTypes.map((st) => st.id);

      this.buildCalendarGrid();
    } catch (err: any) {
      this.error = err.message || 'Failed to load calendar data';
      console.error('Error loading calendar:', err);
    } finally {
      this.loading = false;
    }
  }

  buildCalendarGrid(): void {
    const filteredEntries = this.getFilteredEntries();

    // Group entries by vegetable
    const vegetableMap = new Map<string, CalendarEntry[]>();

    filteredEntries.forEach((entry) => {
      if (!vegetableMap.has(entry.vegetable_name)) {
        vegetableMap.set(entry.vegetable_name, []);
      }
      vegetableMap.get(entry.vegetable_name)!.push(entry);
    });

    // Build rows for grid view
    this.vegetableRows = Array.from(vegetableMap.entries())
      .map(([vegetableName, entries]) => {
        const cells: CalendarCell[] = [];

        // Create 36 cells (one per decade)
        for (let decade = 1; decade <= 36; decade++) {
          const decadeEntries = entries.filter(
            (e) =>
              isDecadeInRange(decade, e.sowing_start_decade, e.sowing_end_decade) ||
              isDecadeInRange(decade, e.harvest_start_decade, e.harvest_end_decade)
          );

          cells.push({
            decade,
            entries: decadeEntries,
          });
        }

        return {
          vegetableName,
          cells,
          hasData: entries.length > 0,
        };
      })
      .filter((row) => row.hasData)
      .sort((a, b) => a.vegetableName.localeCompare(b.vegetableName));
  }

  getFilteredEntries(): CalendarEntry[] {
    return this.calendarEntries.filter((entry) => {
      // Filter by selected vegetables
      if (!this.selectedVegetables.includes(entry.vegetable_name)) {
        return false;
      }

      // Filter by selected sowing types
      if (!this.selectedSowingTypes.includes(entry.sowing_type_id)) {
        return false;
      }

      // Filter by search query
      if (
        this.searchQuery &&
        !entry.vegetable_name.toLowerCase().includes(this.searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }

  toggleVegetable(vegetableName: string): void {
    const index = this.selectedVegetables.indexOf(vegetableName);
    if (index > -1) {
      this.selectedVegetables.splice(index, 1);
    } else {
      this.selectedVegetables.push(vegetableName);
    }
    this.buildCalendarGrid();
  }

  toggleSowingType(sowingTypeId: number): void {
    const index = this.selectedSowingTypes.indexOf(sowingTypeId);
    if (index > -1) {
      this.selectedSowingTypes.splice(index, 1);
    } else {
      this.selectedSowingTypes.push(sowingTypeId);
    }
    this.buildCalendarGrid();
  }

  selectAllVegetables(): void {
    this.selectedVegetables = [...this.allVegetableNames];
    this.buildCalendarGrid();
  }

  deselectAllVegetables(): void {
    this.selectedVegetables = [];
    this.buildCalendarGrid();
  }

  async changeClimate(climateId: number): Promise<void> {
    try {
      this.userSettings = await this.calendarApi.updateUserClimate(climateId);
      await this.loadData(); // Reload to get climate-specific data
    } catch (err) {
      console.error('Error updating climate:', err);
      this.error = 'Failed to update climate preference';
    }
  }

  getCellClass(cell: CalendarCell): string {
    if (cell.entries.length === 0) return 'cell-empty';

    const hasSowing = cell.entries.some((e) =>
      isDecadeInRange(cell.decade, e.sowing_start_decade, e.sowing_end_decade)
    );

    const hasHarvest = cell.entries.some((e) =>
      isDecadeInRange(cell.decade, e.harvest_start_decade, e.harvest_end_decade)
    );

    if (hasSowing && hasHarvest) return 'cell-both';
    if (hasSowing) return 'cell-sowing';
    if (hasHarvest) return 'cell-harvest';

    return 'cell-empty';
  }

  getCellTooltip(cell: CalendarCell): string {
    if (cell.entries.length === 0) return '';

    const sowingEntries = cell.entries.filter((e) =>
      isDecadeInRange(cell.decade, e.sowing_start_decade, e.sowing_end_decade)
    );

    const harvestEntries = cell.entries.filter((e) =>
      isDecadeInRange(cell.decade, e.harvest_start_decade, e.harvest_end_decade)
    );

    const lines: string[] = [];

    if (sowingEntries.length > 0) {
      const types = sowingEntries
        .map((e) => e.sowing_type_icon + ' ' + e.sowing_type_name)
        .join(', ');
      lines.push(`Semis: ${types}`);
    }

    if (harvestEntries.length > 0) {
      lines.push(`Récolte`);
    }

    return lines.join('\n');
  }

  formatPeriod(startDecade: number, endDecade: number): string {
    return formatPeriodRange(startDecade, endDecade);
  }

  // Utility getters
  get filteredVegetableRows(): VegetableRow[] {
    return this.vegetableRows;
  }

  get monthNames(): readonly string[] {
    return MONTH_NAMES;
  }
}
