import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HarvestService } from '../../services/harvest.service';
import { VegetableService } from '../../services/vegetable.service';
import { ImportExportService } from '../../services/import-export.service';
import { MigrationService } from '../../services/migration.service';
import { VegetableApiService } from '../../services/vegetable-api.service';
import { HarvestApiService } from '../../services/harvest-api.service';
import { Harvest } from '../../models/harvest';

@Component({
  selector: 'app-import-export',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-export.html',
  styleUrl: './import-export.css',
})
export default class ImportExport implements OnInit {
  importStatus: 'idle' | 'success' | 'error' = 'idle';
  importMessage = '';
  importedCount = 0;

  exportStatus: 'idle' | 'success' | 'error' = 'idle';
  exportMessage = '';

  sampleDataStatus: 'idle' | 'success' | 'error' = 'idle';
  sampleDataMessage = '';

  // Migration status
  migrationStatus: 'idle' | 'migrating' | 'success' | 'error' = 'idle';
  migrationMessage = '';
  showMigrationSection = false;
  hasDataToMigrate = false;
  isMigrationCompleted = false;

  constructor(
    private harvestService: HarvestService,
    private vegetableService: VegetableService,
    private importExportService: ImportExportService,
    private migrationService: MigrationService,
    private vegetableApiService: VegetableApiService,
    private harvestApiService: HarvestApiService
  ) {}

  ngOnInit(): void {
    // Check migration status
    this.hasDataToMigrate = this.migrationService.hasDataToMigrate();
    this.isMigrationCompleted = this.migrationService.isMigrationCompleted();
    this.showMigrationSection = this.hasDataToMigrate && !this.isMigrationCompleted;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.importFile(file);
  }

  async importFile(file: File): Promise<void> {
    try {
      this.importStatus = 'idle';
      this.importMessage = 'Import en cours...';

      const harvests = await this.importExportService.importHarvestsFromExcel(file);

      // Validate and add harvests
      let addedCount = 0;
      const errors: string[] = [];

      for (const harvest of harvests) {
        // Validate required fields
        if (!harvest.vegetableName || !harvest.quantity || !harvest.date) {
          errors.push(`Ligne ignorée: données manquantes`);
          continue;
        }

        // Check if vegetable exists
        let vegetable = this.vegetableService.findByName(harvest.vegetableName);

        // Create vegetable if it doesn't exist
        if (!vegetable) {
          this.vegetableService.add({
            name: harvest.vegetableName,
            unit: harvest.unit as 'g' | 'kg' | 'pcs',
          });
          vegetable = this.vegetableService.findByName(harvest.vegetableName);
        }

        // Add harvest
        if (vegetable) {
          this.harvestService.add({
            vegetableName: harvest.vegetableName,
            quantity: harvest.quantity,
            unit: vegetable.unit,
            date: harvest.date,
            notes: harvest.notes,
          });
          addedCount++;
        }
      }

      this.importedCount = addedCount;
      this.importStatus = 'success';
      this.importMessage = `${addedCount} récolte(s) importée(s) avec succès !`;

      if (errors.length > 0) {
        this.importMessage += ` (${errors.length} ligne(s) ignorée(s))`;
      }

      // Reset input
      const input = document.getElementById('file-input') as HTMLInputElement;
      if (input) input.value = '';
    } catch (error) {
      this.importStatus = 'error';
      this.importMessage = 'Erreur lors de l\'import du fichier. Vérifiez le format.';
      console.error('Import error:', error);
    }
  }

  exportCurrentData(): void {
    try {
      const harvests = this.harvestService.getAll();

      if (harvests.length === 0) {
        this.exportStatus = 'error';
        this.exportMessage = 'Aucune récolte à exporter.';
        return;
      }

      this.importExportService.exportHarvestsToExcel(
        harvests,
        `recoltes_${new Date().toISOString().split('T')[0]}.xlsx`
      );

      this.exportStatus = 'success';
      this.exportMessage = `${harvests.length} récolte(s) exportée(s) avec succès !`;
    } catch (error) {
      this.exportStatus = 'error';
      this.exportMessage = 'Erreur lors de l\'export.';
      console.error('Export error:', error);
    }
  }

  downloadSampleData(): void {
    try {
      this.importExportService.exportSampleDataToExcel();

      this.sampleDataStatus = 'success';
      this.sampleDataMessage = 'Fichier exemple téléchargé avec succès !';
    } catch (error) {
      this.sampleDataStatus = 'error';
      this.sampleDataMessage = 'Erreur lors de la génération du fichier exemple.';
      console.error('Sample data error:', error);
    }
  }

  loadSampleData(): void {
    try {
      const sampleHarvests = this.importExportService.generateSampleData();

      // Add vegetables first
      const uniqueVegetables = new Set(sampleHarvests.map((h) => h.vegetableName));
      uniqueVegetables.forEach((vegName) => {
        const harvest = sampleHarvests.find((h) => h.vegetableName === vegName);
        if (harvest && !this.vegetableService.findByName(vegName)) {
          this.vegetableService.add({
            name: vegName,
            unit: harvest.unit as 'g' | 'kg' | 'pcs',
          });
        }
      });

      // Add all harvests
      sampleHarvests.forEach((harvest) => {
        this.harvestService.add({
          vegetableName: harvest.vegetableName,
          quantity: harvest.quantity,
          unit: harvest.unit,
          date: harvest.date,
          notes: harvest.notes,
        });
      });

      this.sampleDataStatus = 'success';
      this.sampleDataMessage = `${sampleHarvests.length} récoltes factices ajoutées !`;
    } catch (error) {
      this.sampleDataStatus = 'error';
      this.sampleDataMessage = 'Erreur lors du chargement des données factices.';
      console.error('Load sample data error:', error);
    }
  }

  clearAllData(): void {
    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer TOUTES les données ? Cette action est irréversible.'
      )
    ) {
      this.harvestService.clear();
      this.vegetableService.clear();

      this.importStatus = 'success';
      this.importMessage = 'Toutes les données ont été supprimées.';
    }
  }

  resetStatus(type: 'import' | 'export' | 'sample'): void {
    if (type === 'import') {
      this.importStatus = 'idle';
      this.importMessage = '';
    } else if (type === 'export') {
      this.exportStatus = 'idle';
      this.exportMessage = '';
    } else {
      this.sampleDataStatus = 'idle';
      this.sampleDataMessage = '';
    }
  }

  getCurrentHarvestCount(): number {
    return this.harvestService.getAll().length;
  }

  getCurrentVegetableCount(): number {
    return this.vegetableService.getAll().length;
  }

  // Migration methods
  async migrateToNeon(): Promise<void> {
    if (!confirm('Migrer toutes vos données localStorage vers la base de données Neon ? Cette opération peut prendre quelques secondes.')) {
      return;
    }

    this.migrationStatus = 'migrating';
    this.migrationMessage = 'Migration en cours...';

    try {
      const result = await this.migrationService.migrateToNeon();

      if (result.success) {
        // Enable API mode for both services
        this.vegetableApiService.enableApiMode();
        this.harvestApiService.enableApiMode();

        this.migrationStatus = 'success';
        this.migrationMessage = `Migration réussie ! ${result.vegetablesMigrated} légume(s) et ${result.harvestsMigrated} récolte(s) migrés.`;

        if (result.errors.length > 0) {
          this.migrationMessage += ` ${result.errors.length} erreur(s) rencontrée(s).`;
          console.warn('Migration errors:', result.errors);
        }

        this.showMigrationSection = false;

        // Ask if user wants to clear localStorage
        if (confirm('Migration terminée ! Voulez-vous supprimer les données de localStorage (recommandé) ?')) {
          this.migrationService.clearLocalStorageData();
          this.migrationMessage += ' localStorage nettoyé.';
        }
      } else {
        this.migrationStatus = 'error';
        this.migrationMessage = 'La migration a échoué. Vérifiez la configuration de Neon.';
        console.error('Migration failed:', result.errors);
      }
    } catch (error) {
      this.migrationStatus = 'error';
      this.migrationMessage = `Erreur de migration : ${(error as Error).message}`;
      console.error('Migration error:', error);
    }
  }

  cancelMigration(): void {
    this.showMigrationSection = false;
  }

  resetMigrationStatus(): void {
    this.migrationService.resetMigrationStatus();
    this.vegetableApiService.disableApiMode();
    this.harvestApiService.disableApiMode();
    this.ngOnInit();
  }
}
