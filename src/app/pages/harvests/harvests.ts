import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Harvest } from '../../models/harvest';
import { Vegetable } from '../../models/vegetable';
import { HarvestService } from '../../services/harvest.service';
import { VegetableService } from '../../services/vegetable.service';

@Component({
  selector: 'app-harvests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './harvests.html',
  styleUrl: './harvests.css',
})
export default class Harvests {
  harvests: Harvest[] = [];
  vegetables: Vegetable[] = [];

  // Form fields
  selectedVegetable = '';
  quantity = 0;
  date = '';
  notes = '';
  photo = '';

  constructor(
    private harvestService: HarvestService,
    private vegetableService: VegetableService
  ) {
    this.load();
  }

  load(): void {
    this.harvests = this.harvestService.getAll().sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    this.vegetables = this.vegetableService.getAll();

    // Set default date to today
    if (!this.date) {
      this.date = new Date().toISOString().split('T')[0];
    }
  }

  onAdd(): void {
    if (!this.selectedVegetable || this.quantity <= 0) {
      return;
    }

    const vegetable = this.vegetableService.findByName(this.selectedVegetable);
    if (!vegetable) {
      return;
    }

    this.harvestService.add({
      vegetableName: this.selectedVegetable,
      quantity: this.quantity,
      unit: vegetable.unit,
      date: this.date,
      notes: this.notes,
      photo: this.photo || undefined,
    });

    // Reset form
    this.selectedVegetable = '';
    this.quantity = 0;
    this.notes = '';
    this.photo = '';
    this.date = new Date().toISOString().split('T')[0];

    this.load();
  }

  remove(id: string): void {
    this.harvestService.remove(id);
    this.load();
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  getUnitLabel(unit: string): string {
    const units: Record<string, string> = {
      g: 'grammes',
      kg: 'kg',
      pcs: 'pièces',
    };
    return units[unit] || unit;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    // Limit file size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image est trop grande (max 5MB)');
      return;
    }

    this.convertToBase64(file);
  }

  private convertToBase64(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.photo = reader.result as string;
    };
    reader.onerror = () => {
      alert('Erreur lors de la lecture de l\'image');
    };
    reader.readAsDataURL(file);
  }

  removePhoto(): void {
    this.photo = '';
  }
}
