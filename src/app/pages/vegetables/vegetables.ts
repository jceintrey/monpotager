import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VegetableService } from '../../services/vegetable.service';
import type { Vegetable } from '../../models/vegetable';

@Component({
  selector: 'app-vegetables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vegetables.html',
  styleUrls: ['./vegetables.css']
})
export class Vegetables {
  name = '';
  variety = '';
  unit: Vegetable['unit'] = 'g';
  image = '';

  vegetables: Vegetable[] = [];

  // Edit mode
  isEditing = false;
  editingVegetable?: Vegetable;

  // Image search modal
  showImageModal = false;
  imageSearchQuery = '';
  manualImageUrl = '';
  imageSearchResults: string[] = [];

  constructor(private vegService: VegetableService) {
    this.load();
  }

  load() {
    this.vegetables = this.vegService.getAll();
  }

  onSubmit() {
    if (this.isEditing) {
      this.updateVegetable();
    } else {
      this.addVegetable();
    }
  }

  addVegetable() {
    if (!this.name.trim()) return;
    const veg: Vegetable = {
      name: this.name.trim(),
      variety: this.variety.trim() || undefined,
      unit: this.unit,
      image: this.image || undefined
    };
    this.vegService.add(veg);
    this.resetForm();
    this.load();
  }

  updateVegetable() {
    if (!this.name.trim() || !this.editingVegetable) return;

    // Remove the old vegetable
    this.vegService.remove(this.editingVegetable);

    // Add the updated vegetable
    const veg: Vegetable = {
      name: this.name.trim(),
      variety: this.variety.trim() || undefined,
      unit: this.unit,
      image: this.image || undefined
    };
    this.vegService.add(veg);

    this.resetForm();
    this.load();
  }

  edit(vegetable: Vegetable) {
    this.isEditing = true;
    this.editingVegetable = { ...vegetable };
    this.name = vegetable.name;
    this.variety = vegetable.variety || '';
    this.unit = vegetable.unit;
    this.image = vegetable.image || '';

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.resetForm();
  }

  resetForm() {
    this.isEditing = false;
    this.editingVegetable = undefined;
    this.name = '';
    this.variety = '';
    this.unit = 'g';
    this.image = '';
  }

  remove(vegetable: Vegetable) {
    this.vegService.remove(vegetable);
    this.load();
  }

  getUnitLabel(unit: string): string {
    const units: Record<string, string> = {
      g: 'Grammes',
      kg: 'Kilogrammes',
      pcs: 'Pièces',
    };
    return units[unit] || unit;
  }

  // Image search methods
  openImageSearch(): void {
    this.showImageModal = true;
    this.imageSearchQuery = this.name || '';
    this.manualImageUrl = '';
    this.imageSearchResults = [];

    // Pre-populate with suggestions
    if (this.imageSearchQuery) {
      this.searchImages();
    }
  }

  closeImageSearch(): void {
    this.showImageModal = false;
    this.imageSearchQuery = '';
    this.manualImageUrl = '';
    this.imageSearchResults = [];
  }

  searchImages(): void {
    const query = this.imageSearchQuery.toLowerCase().trim();

    if (!query) return;

    // Predefined vegetable images URLs
    const vegetableImages: Record<string, string[]> = {
      'tomate': [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1546470427-227a1e3e8995?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&h=300&fit=crop',
      ],
      'carotte': [
        'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1582515073490-39981397c445?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&h=300&fit=crop',
      ],
      'courgette': [
        'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1563960778-9e0e66c6e2fb?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop',
      ],
      'salade': [
        'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1515543904379-3d4d2f3d3206?w=400&h=300&fit=crop',
      ],
      'poivron': [
        'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1593038787116-14b0d0c31487?w=400&h=300&fit=crop',
      ],
      'concombre': [
        'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1589621316382-008455b857cd?w=400&h=300&fit=crop',
      ],
      'radis': [
        'https://images.unsplash.com/photo-1598656227409-53fb94d968ed?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1616684355345-26632e27afaa?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1595853035070-59a39fe84de9?w=400&h=300&fit=crop',
      ],
      'aubergine': [
        'https://images.unsplash.com/photo-1659261200833-ec8761558cd7?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1617197235963-d9c4d8c57d7e?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
      ],
    };

    // Try to find matching images or use generic vegetable images
    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Check for exact or partial matches
    let foundImages: string[] | undefined;
    for (const [vegName, images] of Object.entries(vegetableImages)) {
      if (normalizedQuery.includes(vegName) || vegName.includes(normalizedQuery)) {
        foundImages = images;
        break;
      }
    }

    // If no match, use generic vegetable images
    this.imageSearchResults = foundImages || [
      'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1608315326029-bd19c95e71e0?w=400&h=300&fit=crop',
    ];
  }

  selectImage(imageUrl: string): void {
    this.image = imageUrl;
    this.closeImageSearch();
  }

  useManualUrl(): void {
    if (this.manualImageUrl) {
      this.image = this.manualImageUrl;
      this.closeImageSearch();
    }
  }
}
