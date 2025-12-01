/**
 * Calendar Models for MonPotager
 * Sowing and harvest calendar management
 */

// ============================================
// ENUMS & TYPES
// ============================================

export type ClimateCode = 'tempéré' | 'méditerranéen' | 'continental' | 'montagnard';

export type SowingTypeCode = 'indoor_pots' | 'outdoor_pots' | 'direct_soil' | 'transplant';

/**
 * Decade: 1-36 (12 months * 3 decades per month)
 * January: 1-3, February: 4-6, March: 7-9, etc.
 */
export type Decade = number; // 1-36

// ============================================
// INTERFACES
// ============================================

export interface Climate {
  id: number;
  name: ClimateCode;
  description: string;
  created_at: string;
}

export interface SowingType {
  id: number;
  code: SowingTypeCode;
  name: string;
  description: string;
  icon: string;
  created_at: string;
}

export interface CalendarEntry {
  id: number;
  vegetable_name: string;
  climate_id: number;
  climate_name?: string;
  sowing_type_id: number;
  sowing_type_code?: SowingTypeCode;
  sowing_type_name?: string;
  sowing_type_icon?: string;

  sowing_start_decade: Decade;
  sowing_end_decade: Decade;
  harvest_start_decade: Decade;
  harvest_end_decade: Decade;

  growth_duration_days: number | null;
  notes: string | null;
  source?: string;

  is_customized?: boolean; // True if user has overridden this entry
  is_active?: boolean; // For user overrides only
}

export interface UserSettings {
  id: number;
  user_id: string;
  climate_id: number;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserCalendarOverride {
  id?: number;
  user_id: string;
  vegetable_name: string;
  sowing_type_id: number;

  sowing_start_decade?: Decade;
  sowing_end_decade?: Decade;
  harvest_start_decade?: Decade;
  harvest_end_decade?: Decade;

  growth_duration_days?: number;
  notes?: string;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}

// ============================================
// DTO (Data Transfer Objects)
// ============================================

export interface CreateCalendarOverrideDTO {
  vegetable_name: string;
  sowing_type_id: number;
  sowing_start_decade: Decade;
  sowing_end_decade: Decade;
  harvest_start_decade: Decade;
  harvest_end_decade: Decade;
  growth_duration_days?: number;
  notes?: string;
}

export interface UpdateUserSettingsDTO {
  climate_id?: number;
  preferences?: Record<string, any>;
}

// ============================================
// VIEW MODELS (for UI)
// ============================================

export interface CalendarMonth {
  monthIndex: number; // 0-11
  monthName: string;
  decades: CalendarDecade[];
}

export interface CalendarDecade {
  decadeNumber: Decade; // 1-36
  period: 'début' | 'mi' | 'fin';
  entries: CalendarEntryDisplay[];
}

export interface CalendarEntryDisplay extends CalendarEntry {
  displaySowingPeriod: string; // e.g., "début Mars - mi Avril"
  displayHarvestPeriod: string; // e.g., "fin Juin - fin Septembre"
  color: string; // For UI visualization
}

// ============================================
// UTILITY TYPES
// ============================================

export interface DecadeInfo {
  decade: Decade;
  monthIndex: number;
  monthName: string;
  period: 'début' | 'mi' | 'fin';
  displayText: string;
}

// ============================================
// CONSTANTS
// ============================================

export const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const;

export const DECADE_PERIODS = ['début', 'mi', 'fin'] as const;

export const CLIMATE_DESCRIPTIONS: Record<ClimateCode, string> = {
  tempéré: 'Climat tempéré océanique (Paris, Ouest, Nord)',
  méditerranéen: 'Climat méditerranéen (Sud, Provence)',
  continental: 'Climat continental (Est, Alsace)',
  montagnard: 'Climat montagnard (Alpes, Pyrénées)',
};

export const SOWING_TYPE_DESCRIPTIONS: Record<SowingTypeCode, string> = {
  indoor_pots: 'Semis intérieur en godets (sous abri chauffé)',
  outdoor_pots: 'Semis extérieur en godets (châssis, serre froide)',
  direct_soil: 'Semis direct en pleine terre',
  transplant: 'Plantation/Repiquage de plants',
};
