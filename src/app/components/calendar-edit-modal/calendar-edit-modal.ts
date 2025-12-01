import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarApiService } from '../../services/calendar-api.service';
import {
  CalendarEntry,
  SowingType,
  CreateCalendarOverrideDTO,
  Decade,
} from '../../models/calendar';
import { decadeToDisplay, getAllMonthsWithDecades } from '../../utils/calendar.utils';

@Component({
  selector: 'app-calendar-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-edit-modal.html',
  styleUrl: './calendar-edit-modal.css',
})
export class CalendarEditModal {
  @Input() isOpen = false;
  @Input() entry: CalendarEntry | null = null;
  @Input() sowingTypes: SowingType[] = [];
  @Input() allVegetableNames: string[] = [];

  @Output() closeModal = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  // Form data
  vegetableName = '';
  sowingTypeId: number | null = null;
  sowingStartDecade: Decade = 1;
  sowingEndDecade: Decade = 3;
  harvestStartDecade: Decade = 13;
  harvestEndDecade: Decade = 18;
  growthDurationDays: number | null = null;
  notes = '';

  saving = false;
  error: string | null = null;

  // Decades for dropdowns
  decades: { value: Decade; label: string }[] = [];

  constructor(private calendarApi: CalendarApiService) {
    this.buildDecadesDropdown();
  }

  ngOnChanges(): void {
    if (this.entry) {
      this.loadEntry(this.entry);
    } else {
      this.resetForm();
    }
  }

  buildDecadesDropdown(): void {
    this.decades = [];
    for (let d = 1; d <= 36; d++) {
      this.decades.push({
        value: d as Decade,
        label: decadeToDisplay(d as Decade),
      });
    }
  }

  loadEntry(entry: CalendarEntry): void {
    this.vegetableName = entry.vegetable_name;
    this.sowingTypeId = entry.sowing_type_id;
    this.sowingStartDecade = entry.sowing_start_decade;
    this.sowingEndDecade = entry.sowing_end_decade;
    this.harvestStartDecade = entry.harvest_start_decade;
    this.harvestEndDecade = entry.harvest_end_decade;
    this.growthDurationDays = entry.growth_duration_days;
    this.notes = entry.notes || '';
  }

  resetForm(): void {
    this.vegetableName = '';
    this.sowingTypeId = null;
    this.sowingStartDecade = 1;
    this.sowingEndDecade = 3;
    this.harvestStartDecade = 13;
    this.harvestEndDecade = 18;
    this.growthDurationDays = null;
    this.notes = '';
    this.error = null;
  }

  close(): void {
    this.resetForm();
    this.closeModal.emit();
  }

  async save(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.error = null;

    try {
      const data: CreateCalendarOverrideDTO = {
        vegetable_name: this.vegetableName,
        sowing_type_id: this.sowingTypeId!,
        sowing_start_decade: this.sowingStartDecade,
        sowing_end_decade: this.sowingEndDecade,
        harvest_start_decade: this.harvestStartDecade,
        harvest_end_decade: this.harvestEndDecade,
        growth_duration_days: this.growthDurationDays || undefined,
        notes: this.notes || undefined,
      };

      if (this.entry?.is_customized && this.entry.id) {
        // Update existing override
        await this.calendarApi.updateCalendarOverride(this.entry.id, data);
      } else {
        // Create new override
        await this.calendarApi.createCalendarOverride(data);
      }

      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.error = err.message || 'Failed to save calendar entry';
      console.error('Error saving calendar entry:', err);
    } finally {
      this.saving = false;
    }
  }

  validateForm(): boolean {
    if (!this.vegetableName.trim()) {
      this.error = 'Veuillez entrer un nom de légume';
      return false;
    }

    if (!this.sowingTypeId) {
      this.error = 'Veuillez sélectionner un type de semis';
      return false;
    }

    if (
      this.sowingStartDecade < 1 ||
      this.sowingStartDecade > 36 ||
      this.sowingEndDecade < 1 ||
      this.sowingEndDecade > 36 ||
      this.harvestStartDecade < 1 ||
      this.harvestStartDecade > 36 ||
      this.harvestEndDecade < 1 ||
      this.harvestEndDecade > 36
    ) {
      this.error = 'Les décades doivent être entre 1 et 36';
      return false;
    }

    return true;
  }

  get modalTitle(): string {
    return this.entry ? 'Modifier le calendrier' : 'Ajouter une période de culture';
  }

  get isEditMode(): boolean {
    return !!this.entry;
  }
}
