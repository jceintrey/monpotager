import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { HarvestApiService } from '../../services/harvest-api.service';
import { VegetableApiService } from '../../services/vegetable-api.service';
import { Harvest } from '../../models/harvest';
import { Vegetable } from '../../models/vegetable';

Chart.register(...registerables);

interface MonthlyData {
  month: string;
  quantity: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export default class Statistics implements OnInit, OnDestroy {
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvasPcs') pieCanvasPcs!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;

  pieChart?: Chart;
  pieChartPcs?: Chart;
  lineChart?: Chart;

  vegetables: Vegetable[] = [];
  harvests: Harvest[] = [];
  selectedVegetables: string[] = [];

  constructor(
    private harvestApiService: HarvestApiService,
    private vegetableApiService: VegetableApiService
  ) {}

  async ngOnInit(): Promise<void> {
    this.vegetables = await this.vegetableApiService.getAll();
    this.harvests = await this.harvestApiService.getAll();

    // Select all vegetables by default
    this.selectedVegetables = this.vegetables.map((v) => v.name);

    // Wait for view to be ready
    setTimeout(() => {
      this.createPieChart();
      this.createPieChartPcs();
      this.createLineChart();
    }, 0);
  }

  ngOnDestroy(): void {
    this.pieChart?.destroy();
    this.pieChartPcs?.destroy();
    this.lineChart?.destroy();
  }

  toggleVegetable(vegName: string): void {
    const index = this.selectedVegetables.indexOf(vegName);
    if (index > -1) {
      this.selectedVegetables.splice(index, 1);
    } else {
      this.selectedVegetables.push(vegName);
    }
    this.updateLineChart();
  }

  isSelected(vegName: string): boolean {
    return this.selectedVegetables.includes(vegName);
  }

  selectAll(): void {
    this.selectedVegetables = this.vegetables.map((v) => v.name);
    this.updateLineChart();
  }

  deselectAll(): void {
    this.selectedVegetables = [];
    this.updateLineChart();
  }

  private createPieChart(): void {
    if (!this.pieCanvas) return;

    const ctx = this.pieCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Calculate total quantity per vegetable (weight only: g/kg)
    const vegData = this.vegetables
      .filter((veg) => veg.unit === 'g' || veg.unit === 'kg')
      .map((veg) => {
        const vegHarvests = this.harvests.filter((h) => h.vegetableName === veg.name);
        const totalInGrams = vegHarvests.reduce((sum, h) => {
          return sum + (h.unit === 'kg' ? h.quantity * 1000 : h.quantity);
        }, 0);
        const totalInKg = totalInGrams / 1000;
        return { name: veg.name, total: totalInKg, unit: 'kg' };
      });

    // Filter vegetables with harvests
    const vegWithHarvests = vegData.filter((v) => v.total > 0);

    if (vegWithHarvests.length === 0) {
      return;
    }

    const colors = this.generateColors(vegWithHarvests.length);

    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: vegWithHarvests.map((v) => v.name),
        datasets: [
          {
            label: 'Quantité totale récoltée (poids)',
            data: vegWithHarvests.map((v) => v.total),
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const veg = vegWithHarvests[context.dataIndex];
                return `${veg.name}: ${veg.total.toFixed(2)} kg`;
              },
            },
          },
        },
      },
    });
  }

  private createPieChartPcs(): void {
    if (!this.pieCanvasPcs) return;

    const ctx = this.pieCanvasPcs.nativeElement.getContext('2d');
    if (!ctx) return;

    // Calculate total quantity per vegetable (pieces only)
    const vegData = this.vegetables
      .filter((veg) => veg.unit === 'pcs')
      .map((veg) => {
        const vegHarvests = this.harvests.filter((h) => h.vegetableName === veg.name);
        const total = vegHarvests.reduce((sum, h) => sum + h.quantity, 0);
        return { name: veg.name, total, unit: 'pcs' };
      });

    // Filter vegetables with harvests
    const vegWithHarvests = vegData.filter((v) => v.total > 0);

    if (vegWithHarvests.length === 0) {
      return;
    }

    const colors = this.generateColors(vegWithHarvests.length);

    this.pieChartPcs = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: vegWithHarvests.map((v) => v.name),
        datasets: [
          {
            label: 'Quantité totale récoltée (pièces)',
            data: vegWithHarvests.map((v) => v.total),
            backgroundColor: colors,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const veg = vegWithHarvests[context.dataIndex];
                return `${veg.name}: ${veg.total} pcs`;
              },
            },
          },
        },
      },
    });
  }

  private createLineChart(): void {
    if (!this.lineCanvas) return;

    const ctx = this.lineCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Quantité récoltée',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Mois',
            },
          },
        },
      },
    });

    this.updateLineChart();
  }

  private updateLineChart(): void {
    if (!this.lineChart) return;

    // Get monthly data for selected vegetables
    const monthlyDataMap = new Map<string, Map<string, number>>();
    const allMonths = new Set<string>();

    this.selectedVegetables.forEach((vegName) => {
      const vegHarvests = this.harvests.filter((h) => h.vegetableName === vegName);
      const monthlyMap = new Map<string, number>();

      vegHarvests.forEach((harvest) => {
        const date = new Date(harvest.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        allMonths.add(monthKey);

        const current = monthlyMap.get(monthKey) || 0;
        monthlyMap.set(monthKey, current + harvest.quantity);
      });

      monthlyDataMap.set(vegName, monthlyMap);
    });

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort();

    // Create datasets for each vegetable
    const colors = this.generateColors(this.selectedVegetables.length);
    const datasets = this.selectedVegetables.map((vegName, index) => {
      const monthlyMap = monthlyDataMap.get(vegName) || new Map();
      const data = sortedMonths.map((month) => monthlyMap.get(month) || 0);

      return {
        label: vegName,
        data: data,
        borderColor: colors[index],
        backgroundColor: colors[index] + '40',
        tension: 0.3,
        fill: false,
      };
    });

    // Format month labels (YYYY-MM -> Mois YYYY)
    const labels = sortedMonths.map((month) => {
      const [year, monthNum] = month.split('-');
      const monthNames = [
        'Jan',
        'Fév',
        'Mar',
        'Avr',
        'Mai',
        'Juin',
        'Juil',
        'Aoû',
        'Sep',
        'Oct',
        'Nov',
        'Déc',
      ];
      return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    });

    this.lineChart.data.labels = labels;
    this.lineChart.data.datasets = datasets;
    this.lineChart.update();
  }

  private generateColors(count: number): string[] {
    const baseColors = [
      '#16a34a', // green
      '#ea580c', // orange
      '#dc2626', // red
      '#2563eb', // blue
      '#9333ea', // purple
      '#ca8a04', // yellow
      '#0891b2', // cyan
      '#e11d48', // pink
      '#65a30d', // lime
      '#0284c7', // sky
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // Generate more colors if needed
    const colors = [...baseColors];
    while (colors.length < count) {
      const h = (colors.length * 137.5) % 360;
      colors.push(`hsl(${h}, 70%, 50%)`);
    }

    return colors;
  }

  private getUnitLabel(unit: string): string {
    const units: Record<string, string> = {
      g: 'g',
      kg: 'kg',
      pcs: 'pcs',
    };
    return units[unit] || unit;
  }

  getTotalHarvests(): number {
    return this.harvests.length;
  }

  getTotalQuantity(): number {
    return this.harvests.reduce((sum, h) => sum + h.quantity, 0);
  }

  getMostHarvestedVegetable(): string {
    const vegData = this.vegetables.map((veg) => {
      const vegHarvests = this.harvests.filter((h) => h.vegetableName === veg.name);
      const total = vegHarvests.reduce((sum, h) => sum + h.quantity, 0);
      return { name: veg.name, total };
    });

    vegData.sort((a, b) => b.total - a.total);
    return vegData[0]?.name || 'Aucun';
  }

  hasWeightVegetables(): boolean {
    return this.vegetables.some((v) => v.unit === 'g' || v.unit === 'kg');
  }

  hasPcsVegetables(): boolean {
    return this.vegetables.some((v) => v.unit === 'pcs');
  }
}
