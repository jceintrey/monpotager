import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Harvest } from '../models/harvest';
import { Vegetable } from '../models/vegetable';

interface ExportData {
  'Légume': string;
  'Quantité': number;
  'Unité': string;
  'Date': string;
  'Notes': string;
}

@Injectable({
  providedIn: 'root',
})
export class ImportExportService {
  exportHarvestsToExcel(harvests: Harvest[], filename: string = 'recoltes.xlsx'): void {
    // Transform harvests to export format
    const exportData: ExportData[] = harvests.map((h) => ({
      'Légume': h.vegetableName,
      'Quantité': h.quantity,
      'Unité': h.unit,
      'Date': this.formatDateForExcel(h.date),
      'Notes': h.notes || '',
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Légume
      { wch: 12 }, // Quantité
      { wch: 10 }, // Unité
      { wch: 12 }, // Date
      { wch: 30 }, // Notes
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Récoltes');

    // Save file
    XLSX.writeFile(wb, filename);
  }

  importHarvestsFromExcel(file: File): Promise<Partial<Harvest>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });

          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON - use any since imported data may have different column names
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

          // Transform to Harvest format
          const harvests: Partial<Harvest>[] = jsonData.map((row: any) => ({
            vegetableName: row['Légume'] || row['Legume'] || '',
            quantity: Number(row['Quantité'] || row['Quantite']) || 0,
            unit: row['Unité'] || row['Unite'] || 'g',
            date: this.parseDateFromExcel(row['Date']),
            notes: row['Notes'] || '',
          }));

          resolve(harvests);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      };

      reader.readAsBinaryString(file);
    });
  }

  generateSampleData(): Harvest[] {
    const vegetables = [
      { name: 'Tomates', unit: 'kg' as const },
      { name: 'Carottes', unit: 'kg' as const },
      { name: 'Courgettes', unit: 'pcs' as const },
      { name: 'Salade', unit: 'pcs' as const },
      { name: 'Haricots verts', unit: 'g' as const },
      { name: 'Poivrons', unit: 'pcs' as const },
      { name: 'Aubergines', unit: 'kg' as const },
      { name: 'Concombres', unit: 'pcs' as const },
      { name: 'Radis', unit: 'g' as const },
      { name: 'Épinards', unit: 'g' as const },
    ];

    const notes = [
      'Excellente récolte',
      'Qualité moyenne',
      'Belle production',
      'Première récolte de la saison',
      'Récolte tardive',
      '',
      '',
      'Très bon rendement',
      '',
    ];

    const harvests: Harvest[] = [];
    const startDate = new Date(2024, 0, 1); // Start from Jan 1, 2024
    const endDate = new Date();

    // Generate random harvests over the past year
    for (let i = 0; i < 150; i++) {
      const veg = vegetables[Math.floor(Math.random() * vegetables.length)];
      const randomDate = new Date(
        startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
      );

      let quantity: number;
      if (veg.unit === 'kg') {
        quantity = Math.round((Math.random() * 5 + 0.5) * 10) / 10; // 0.5 to 5.5 kg
      } else if (veg.unit === 'pcs') {
        quantity = Math.floor(Math.random() * 15) + 1; // 1 to 15 pieces
      } else {
        quantity = Math.floor(Math.random() * 500) + 100; // 100 to 600 g
      }

      harvests.push({
        id: this.generateId(),
        vegetableName: veg.name,
        quantity: quantity,
        unit: veg.unit,
        date: randomDate.toISOString().split('T')[0],
        notes: notes[Math.floor(Math.random() * notes.length)],
      });
    }

    // Sort by date
    harvests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return harvests;
  }

  exportSampleDataToExcel(): void {
    const sampleData = this.generateSampleData();
    this.exportHarvestsToExcel(sampleData, 'recoltes_exemple.xlsx');
  }

  private formatDateForExcel(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR');
  }

  private parseDateFromExcel(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    // Try to parse different date formats
    let date: Date;

    // Check if it's already ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try French format DD/MM/YYYY
    const frenchMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (frenchMatch) {
      const [, day, month, year] = frenchMatch;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } else {
      // Fallback to default parsing
      date = new Date(dateStr);
    }

    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
