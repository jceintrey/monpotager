export type Unit = 'g' | 'pcs' | 'kg';

export interface Vegetable {
  name: string;
  variety?: string;
  unit: Unit;
  image?: string;
}

export const DEFAULT_VEGETABLES: Vegetable[] = [
  { name: 'carottes', unit: 'pcs', image: 'https://via.placeholder.com/48?text=Car' },
  { name: 'tomates', unit: 'g', image: 'https://via.placeholder.com/48?text=Tom' },
  { name: 'haricots', unit: 'g', image: 'https://via.placeholder.com/48?text=Har' },
  { name: 'salade', unit: 'pcs', image: 'https://via.placeholder.com/48?text=Sal' },
  { name: 'citrouille', unit: 'pcs', image: 'https://via.placeholder.com/48?text=Cit' }
];
