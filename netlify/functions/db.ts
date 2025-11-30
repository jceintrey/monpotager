import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export interface Vegetable {
  id?: number;
  name: string;
  variety?: string;
  unit: 'g' | 'pcs' | 'kg';
  image?: string;
  created_at?: Date;
}

export interface Harvest {
  id?: number;
  vegetable_id: number;
  vegetable_name: string;
  quantity: number;
  unit: string;
  date: string;
  notes?: string;
  photo?: string;
  created_at?: Date;
}
