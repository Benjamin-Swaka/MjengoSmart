// ============================================================
// MjengoSmart — Material Estimation Module (v2)
// Fully frontend, rule-based, no backend dependencies
// ============================================================

import React, { useState, useMemo, useCallback, useRef } from 'react';

// ── ─────────────────────────────────────────────────────────
// SECTION 1: TYPES
// ────────────────────────────────────────────────────────────

type ProjectType =
  | 'foundation' | 'walls' | 'roofing' | 'flooring' | 'full_house'
  | 'apartment' | 'bungalow' | 'maisonette' | 'perimeter_wall'
  | 'septic_tank' | 'water_tower' | 'commercial_shop';

type ConstructionStandard = 'economy' | 'standard' | 'premium';
type Region = 'nairobi' | 'mombasa' | 'kisumu' | 'eldoret' | 'nakuru';
type RoofType = 'gable' | 'hip' | 'flat' | 'mono_pitch';
type FoundationType = 'strip' | 'raft' | 'pad';
type IronSheetGauge = '28g' | '30g';
type TileType = 'ceramic' | 'porcelain';
type StoneType = 'machine_cut' | 'quarry';
type SteelGrade = 'y10' | 'y12' | 'y16';
type UnitSystem = 'metric' | 'imperial';

interface WastageConfig {
  blocks: number;
  tiles: number;
  timber: number;
  roofing: number;
}

interface MaterialLine {
  id: string;
  name: string;
  category: 'foundation' | 'walls' | 'roofing' | 'flooring' | 'misc';
  quantity: number;
  unit: string;
  price_min: number;
  price_max: number;
  subtotal_min: number;
  subtotal_max: number;
  // For editable table
  qty_override?: number;
  price_min_override?: number;
  price_max_override?: number;
}

interface EstimatorOutput {
  area_sqm: number;
  perimeter_m: number;
  wall_area_sqm: number;
  net_wall_area_sqm: number;
  materials: MaterialLine[];
  total_min: number;
  total_max: number;
  cost_per_sqm_min: number;
  cost_per_sqm_max: number;
  cement_bags_per_sqm: number;
  roofing_coverage_sqm: number;
  notes: string[];
  warnings: string[];
}

interface SavedEstimate {
  id: string;
  label: string;
  timestamp: number;
  config: EstimatorConfig;
  result: EstimatorOutput;
}

interface EstimatorConfig {
  projectType: ProjectType;
  standard: ConstructionStandard;
  region: Region;
  length: number;
  width: number;
  height: number;
  floors: number;
  roofType: RoofType;
  foundationType: FoundationType;
  ironSheetGauge: IronSheetGauge;
  tileType: TileType;
  stoneType: StoneType;
  steelGrade: SteelGrade;
  unitSystem: UnitSystem;
  doors: number;
  windows: number;
  overhang: number;
  wastage: WastageConfig;
}

// ── ─────────────────────────────────────────────────────────
// SECTION 2: CONSTANTS & PRICING CONFIG
// ────────────────────────────────────────────────────────────

const STANDARD_MULTIPLIERS: Record<ConstructionStandard, {
  wastageExtra: number;
  priceMultiplier: number;
  label: string;
  color: string;
}> = {
  economy:  { wastageExtra: 0.05, priceMultiplier: 0.85, label: 'Economy',  color: '#e67e22' },
  standard: { wastageExtra: 0.10, priceMultiplier: 1.00, label: 'Standard', color: '#2d6a4f' },
  premium:  { wastageExtra: 0.15, priceMultiplier: 1.35, label: 'Premium',  color: '#8b5cf6' },
};

const REGION_ADJUSTMENTS: Record<Region, {
  label: string;
  cement_factor: number;
  sand_factor: number;
  transport_factor: number;
}> = {
  nairobi:  { label: 'Nairobi',  cement_factor: 1.00, sand_factor: 1.00, transport_factor: 1.00 },
  mombasa:  { label: 'Mombasa',  cement_factor: 1.08, sand_factor: 0.90, transport_factor: 1.15 },
  kisumu:   { label: 'Kisumu',   cement_factor: 1.05, sand_factor: 0.95, transport_factor: 1.10 },
  eldoret:  { label: 'Eldoret',  cement_factor: 1.03, sand_factor: 1.05, transport_factor: 1.08 },
  nakuru:   { label: 'Nakuru',   cement_factor: 1.02, sand_factor: 1.02, transport_factor: 1.05 },
};

const ROOF_SLOPE_MULTIPLIERS: Record<RoofType, { factor: number; label: string }> = {
  gable:      { factor: 1.30, label: 'Gable Roof'     },
  hip:        { factor: 1.40, label: 'Hip Roof'        },
  flat:       { factor: 1.05, label: 'Flat Roof'       },
  mono_pitch: { factor: 1.20, label: 'Mono-Pitch Roof' },
};

const IRON_SHEET_PRICES: Record<IronSheetGauge, { min: number; max: number; label: string }> = {
  '28g': { min: 650,  max: 900,  label: '28G (Standard)' },
  '30g': { min: 850,  max: 1150, label: '30G (Heavy Duty)' },
};

const TILE_PRICES: Record<TileType, { min: number; max: number; label: string }> = {
  ceramic:   { min: 55,  max: 120, label: 'Ceramic (600×600mm)'  },
  porcelain: { min: 120, max: 250, label: 'Porcelain (600×600mm)' },
};

const STEEL_PRICES: Record<SteelGrade, { min: number; max: number; label: string }> = {
  y10: { min: 650,  max: 850,  label: 'Y10 Rebar' },
  y12: { min: 850,  max: 1100, label: 'Y12 Rebar' },
  y16: { min: 1100, max: 1450, label: 'Y16 Rebar' },
};

const BASE_CEMENT_PRICE = { min: 700, max: 850 };
const BASE_SAND_PRICE   = { min: 2500, max: 3500 };
const BASE_HARDCORE_PRICE = { min: 2000, max: 3000 };

const PROJECT_TYPES: { value: ProjectType; label: string; icon: string; desc: string; group: string }[] = [
  { value: 'full_house',     label: 'Full House',      icon: '🏗️', desc: 'Complete estimate',          group: 'Residential' },
  { value: 'bungalow',       label: 'Bungalow',        icon: '🏡', desc: 'Single-storey home',          group: 'Residential' },
  { value: 'maisonette',     label: 'Maisonette',      icon: '🏘️', desc: 'Multi-storey residential',    group: 'Residential' },
  { value: 'apartment',      label: 'Apartment Block', icon: '🏢', desc: 'Multi-unit building',          group: 'Residential' },
  { value: 'commercial_shop',label: 'Commercial Shop', icon: '🏪', desc: 'Retail/office space',          group: 'Commercial' },
  { value: 'foundation',     label: 'Foundation Only', icon: '⛏️', desc: 'Strip/raft footing',           group: 'Partial' },
  { value: 'walls',          label: 'Walls & Blocks',  icon: '🧱', desc: 'Block laying & mortar',        group: 'Partial' },
  { value: 'roofing',        label: 'Roofing Only',    icon: '🏠', desc: 'Roof structure & covering',    group: 'Partial' },
  { value: 'flooring',       label: 'Flooring Only',   icon: '🟫', desc: 'Tiles & screed',               group: 'Partial' },
  { value: 'perimeter_wall', label: 'Perimeter Wall',  icon: '🔲', desc: 'Boundary fencing/wall',        group: 'Civil' },
  { value: 'septic_tank',    label: 'Septic Tank',     icon: '⚙️', desc: 'Waste management system',      group: 'Civil' },
  { value: 'water_tower',    label: 'Water Tower',     icon: '💧', desc: 'Elevated water storage',       group: 'Civil' },
];

const DEFAULT_WASTAGE: WastageConfig = {
  blocks:  10,
  tiles:   10,
  timber:  12,
  roofing: 8,
};

// ── ─────────────────────────────────────────────────────────
// SECTION 3: FORMULA ENGINE (pure functions)
// ────────────────────────────────────────────────────────────

function feetToMeters(v: number) { return v * 0.3048; }

function resolveRegionPrices(region: Region, base: { min: number; max: number }, type: 'cement' | 'sand' | 'other') {
  const r = REGION_ADJUSTMENTS[region];
  const factor = type === 'cement' ? r.cement_factor : type === 'sand' ? r.sand_factor : r.transport_factor;
  return { min: Math.round(base.min * factor), max: Math.round(base.max * factor) };
}

function applyStandard(price: { min: number; max: number }, standard: ConstructionStandard) {
  const m = STANDARD_MULTIPLIERS[standard].priceMultiplier;
  return { min: Math.round(price.min * m), max: Math.round(price.max * m) };
}

function withWastage(qty: number, wastagePercent: number): number {
  return Math.ceil(qty * (1 + wastagePercent / 100));
}

function makeLine(
  id: string,
  name: string,
  category: MaterialLine['category'],
  quantity: number,
  unit: string,
  price: { min: number; max: number }
): MaterialLine {
  return {
    id, name, category, quantity, unit,
    price_min: price.min,
    price_max: price.max,
    subtotal_min: quantity * price.min,
    subtotal_max: quantity * price.max,
  };
}

function calculateFoundation(
  perimeter: number, floors: number,
  foundationType: FoundationType, steelGrade: SteelGrade,
  standard: ConstructionStandard, region: Region,
  area: number
): MaterialLine[] {
  const lines: MaterialLine[] = [];
  const sm = STANDARD_MULTIPLIERS[standard];

  if (foundationType === 'strip') {
    const vol = perimeter * 0.6 * 0.5;
    const bags = Math.ceil(vol * 7);
    const cPrice = applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard);
    lines.push(makeLine('f_cement', 'Cement (Foundation)', 'foundation', bags, '50kg bags', cPrice));
    const sand = Math.ceil(vol * 0.5);
    const sPrice = applyStandard(resolveRegionPrices(region, BASE_SAND_PRICE, 'sand'), standard);
    lines.push(makeLine('f_sand', 'Sand (Foundation)', 'foundation', Math.max(1, sand), 'tonnes', sPrice));
    const hardcore = Math.ceil(vol * 0.8);
    const hPrice = applyStandard(resolveRegionPrices(region, BASE_HARDCORE_PRICE, 'other'), standard);
    lines.push(makeLine('f_hardcore', 'Hardcore / Ballast', 'foundation', Math.max(1, hardcore), 'tonnes', hPrice));
    const rebar = Math.ceil(perimeter * (floors > 2 ? 3 : 2));
    const rPrice = applyStandard(STEEL_PRICES[steelGrade], standard);
    lines.push(makeLine('f_rebar', `Steel Rebar (${STEEL_PRICES[steelGrade].label})`, 'foundation', rebar, 'lengths', rPrice));
  } else if (foundationType === 'raft') {
    const vol = area * 0.25;
    const bags = Math.ceil(vol * 8);
    const cPrice = applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard);
    lines.push(makeLine('f_cement', 'Cement (Raft Foundation)', 'foundation', bags, '50kg bags', cPrice));
    const sand = Math.ceil(vol * 0.6);
    const sPrice = applyStandard(resolveRegionPrices(region, BASE_SAND_PRICE, 'sand'), standard);
    lines.push(makeLine('f_sand', 'Sand (Raft)', 'foundation', Math.max(1, sand), 'tonnes', sPrice));
    const hardcore = Math.ceil(area * 0.15);
    const hPrice = applyStandard(resolveRegionPrices(region, BASE_HARDCORE_PRICE, 'other'), standard);
    lines.push(makeLine('f_hardcore', 'Hardcore / Ballast', 'foundation', Math.max(1, hardcore), 'tonnes', hPrice));
    const meshSheets = Math.ceil(area / 3.6);
    const rPrice = applyStandard(STEEL_PRICES[steelGrade], standard);
    lines.push(makeLine('f_mesh', `BRC Mesh / Rebar (${STEEL_PRICES[steelGrade].label})`, 'foundation', meshSheets, 'sheets/lengths', rPrice));
  } else if (foundationType === 'pad') {
    const pads = Math.ceil((perimeter / 3) * 2);
    const vol = pads * 0.6 * 0.6 * 0.5;
    const bags = Math.ceil(vol * 7);
    const cPrice = applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard);
    lines.push(makeLine('f_cement', 'Cement (Pad Footings)', 'foundation', bags, '50kg bags', cPrice));
    const rebar = Math.ceil(pads * 4);
    const rPrice = applyStandard(STEEL_PRICES[steelGrade], standard);
    lines.push(makeLine('f_rebar', `Steel Rebar (${STEEL_PRICES[steelGrade].label})`, 'foundation', rebar, 'lengths', rPrice));
    const formwork = Math.ceil(pads * 1.5);
    lines.push(makeLine('f_formwork', 'Formwork Timber', 'foundation', formwork, 'pieces', applyStandard({ min: 350, max: 600 }, standard)));
  }

  return lines;
}

function calculateWalls(
  netWallArea: number, standard: ConstructionStandard, region: Region,
  stoneType: StoneType, wastageBlocks: number
): MaterialLine[] {
  const lines: MaterialLine[] = [];
  const blocksPerSqm = stoneType === 'machine_cut' ? 10 : 55; // machine-cut stones vs concrete blocks
  const blockName = stoneType === 'machine_cut' ? 'Machine-Cut Stones' : 'Concrete Blocks (6")';
  const blockPrice = stoneType === 'machine_cut'
    ? applyStandard({ min: 35, max: 55 }, standard)
    : applyStandard({ min: 18, max: 28 }, standard);
  const blocks = withWastage(Math.ceil(netWallArea * blocksPerSqm), wastageBlocks);
  lines.push(makeLine('w_blocks', blockName, 'walls', blocks, 'pieces', blockPrice));
  const cBags = Math.ceil(netWallArea * 0.3);
  const cPrice = applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard);
  lines.push(makeLine('w_cement', 'Cement (Walls & Mortar)', 'walls', cBags, '50kg bags', cPrice));
  const sand = Math.ceil(netWallArea * 0.04);
  const sPrice = applyStandard(resolveRegionPrices(region, BASE_SAND_PRICE, 'sand'), standard);
  lines.push(makeLine('w_sand', 'Sand (Mortar & Plaster)', 'walls', Math.max(1, sand), 'tonnes', sPrice));
  return lines;
}

function calculateRoofing(
  area: number, perimeter: number, length: number, width: number,
  roofType: RoofType, ironSheetGauge: IronSheetGauge, overhang: number,
  standard: ConstructionStandard, wastageRoofing: number, wastageTimber: number
): MaterialLine[] {
  const lines: MaterialLine[] = [];
  const slopeFactor = ROOF_SLOPE_MULTIPLIERS[roofType].factor;
  const roofArea = (area + perimeter * overhang) * slopeFactor;
  const sheets = withWastage(Math.ceil(roofArea / 0.7), wastageRoofing);
  const sheetPrice = applyStandard(IRON_SHEET_PRICES[ironSheetGauge], standard);
  lines.push(makeLine('r_sheets', `Iron Sheets (${IRON_SHEET_PRICES[ironSheetGauge].label})`, 'roofing', sheets, 'sheets', sheetPrice));
  const purlins = withWastage(Math.ceil(roofArea * 0.15), wastageTimber);
  lines.push(makeLine('r_purlins', 'Timber Purlins (2"×3")', 'roofing', purlins, 'pieces', applyStandard({ min: 400, max: 700 }, standard)));
  const rafters = withWastage(Math.ceil(perimeter / 1.2), wastageTimber);
  const rafterLabel = standard === 'premium' ? 'Timber Rafters (2"×8") — Premium' : 'Timber Rafters (2"×6")';
  const rafterPrice = standard === 'premium' ? { min: 950, max: 1400 } : { min: 700, max: 1000 };
  lines.push(makeLine('r_rafters', rafterLabel, 'roofing', rafters, 'pieces', applyStandard(rafterPrice, standard)));
  const ridgeCap = Math.ceil((length + width) / 1.8);
  lines.push(makeLine('r_ridge', 'Ridge Cap', 'roofing', ridgeCap, 'pieces', applyStandard({ min: 350, max: 500 }, standard)));
  if (roofType !== 'flat') {
    const fascia = Math.ceil(perimeter / 3.6);
    lines.push(makeLine('r_fascia', 'Fascia Board (6"×1")', 'roofing', fascia, 'pieces', applyStandard({ min: 350, max: 500 }, standard)));
  }
  return lines;
}

function calculateFlooring(
  area: number, floors: number, tileType: TileType,
  standard: ConstructionStandard, region: Region, wastage: number
): MaterialLine[] {
  const lines: MaterialLine[] = [];
  const tilesNeeded = withWastage(Math.ceil(area * Math.ceil(floors)), wastage);
  const tilePrice = applyStandard(TILE_PRICES[tileType], standard);
  lines.push(makeLine('fl_tiles', `${TILE_PRICES[tileType].label}`, 'flooring', tilesNeeded, 'pieces', tilePrice));
  const screedBags = Math.ceil(area * Math.ceil(floors) * 0.15);
  const cPrice = applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard);
  lines.push(makeLine('fl_screed', 'Cement (Floor Screed)', 'flooring', screedBags, '50kg bags', cPrice));
  const tileSand = Math.max(1, Math.ceil(area * Math.ceil(floors) * 0.02));
  const sPrice = applyStandard(resolveRegionPrices(region, BASE_SAND_PRICE, 'sand'), standard);
  lines.push(makeLine('fl_sand', 'Sand (Tile Bedding)', 'flooring', tileSand, 'tonnes', sPrice));
  const adhesive = Math.ceil(area * Math.ceil(floors) / 5);
  lines.push(makeLine('fl_adhesive', 'Tile Adhesive', 'flooring', Math.max(1, adhesive), 'bags', applyStandard({ min: 600, max: 900 }, standard)));
  if (standard === 'premium') {
    const grout = Math.ceil(area * Math.ceil(floors) / 20);
    lines.push(makeLine('fl_grout', 'Premium Grout', 'flooring', Math.max(1, grout), 'bags', { min: 450, max: 700 }));
  }
  return lines;
}

function generateWarnings(config: EstimatorConfig): string[] {
  const warns: string[] = [];
  const { length, width, floors, roofType, foundationType, region } = config;
  if (width > 7) warns.push('⚠️ Building width exceeds 7m — structural columns likely required.');
  if (length > 15 || width > 15) warns.push('⚠️ Large span detected — consult a structural engineer for beam sizing.');
  if (floors >= 3) warns.push('⚠️ 3+ floors require a Structural Engineer\'s review and approved drawings.');
  if (floors > 4 && foundationType !== 'raft') warns.push('⚠️ 5+ floors strongly recommend raft or pile foundation.');
  if ((length > 12 || width > 12) && roofType !== 'flat') warns.push('⚠️ Large roof span may require steel trusses instead of timber rafters.');
  if (region === 'mombasa') warns.push('⚠️ Coastal region: use marine-grade or hot-dipped galvanised iron sheets to resist corrosion.');
  if (config.standard === 'economy' && floors > 2) warns.push('⚠️ Economy finishes on multi-storey buildings may not meet structural requirements.');
  return warns;
}

function generateNotes(config: EstimatorConfig): string[] {
  const notes: string[] = [];
  const { foundationType, roofType, tileType, standard, region, floors, stoneType } = config;
  if (foundationType === 'strip') notes.push('Foundation assumes 600mm depth × 500mm width strip footing.');
  if (foundationType === 'raft') notes.push('Raft foundation assumes 250mm slab thickness over full floor area.');
  if (foundationType === 'pad') notes.push('Pad foundation assumes 600×600×500mm pads at 3m column centres.');
  notes.push(`Roof area calculated with ${ROOF_SLOPE_MULTIPLIERS[roofType].label} slope factor (×${ROOF_SLOPE_MULTIPLIERS[roofType].factor}).`);
  if (tileType === 'porcelain' || standard === 'premium') notes.push('Premium finishes: specify anti-slip rating for tiles in wet areas.');
  if (standard === 'premium') notes.push('Premium spec includes upgraded material grades and tighter wastage controls.');
  if (standard === 'economy') notes.push('Economy spec uses lower-cost materials — verify structural adequacy with a professional.');
  if (region === 'mombasa') notes.push('Coastal spec: consider marine-grade or galvanised fasteners throughout.');
  if (stoneType === 'machine_cut') notes.push('Machine-cut stone walls use 10 stones/m² (200×200×400mm units).');
  else notes.push('Block count includes configured wastage allowance.');
  notes.push(`Prices reflect current ${REGION_ADJUSTMENTS[region].label} market rates (2024).`);
  notes.push('Labour costs excluded — use the Workers section to budget for fundis separately.');
  notes.push('Obtain formal quotations from at least 3 suppliers before final budgeting.');
  if (floors > 1) notes.push(`Multi-storey estimate covers ${floors} floors of equal dimensions.`);
  return notes;
}

function runCalculation(config: EstimatorConfig): EstimatorOutput {
  const {
    projectType, standard, region, length: rawL, width: rawW,
    height, floors, roofType, foundationType, ironSheetGauge, tileType,
    stoneType, steelGrade, unitSystem, doors, windows, overhang, wastage,
  } = config;

  const length = unitSystem === 'imperial' ? feetToMeters(rawL) : rawL;
  const width  = unitSystem === 'imperial' ? feetToMeters(rawW) : rawW;

  const area      = length * width;
  const perimeter = 2 * (length + width);
  const wallArea  = perimeter * height * floors;
  const openingArea = (doors * 2.1 * 0.9) + (windows * 1.2 * 1.0);
  const netWallArea = Math.max(0, wallArea - openingArea);

  const needs = (types: ProjectType[]) => types.includes(projectType);
  const isBuilding = needs(['full_house','bungalow','maisonette','apartment','commercial_shop']);

  let materials: MaterialLine[] = [];

  // Foundation
  if (needs(['foundation', 'full_house', 'bungalow', 'maisonette', 'apartment', 'commercial_shop'])) {
    materials.push(...calculateFoundation(perimeter, floors, foundationType, steelGrade, standard, region, area));
  }

  // Walls
  if (needs(['walls', 'full_house', 'bungalow', 'maisonette', 'apartment', 'commercial_shop'])) {
    materials.push(...calculateWalls(netWallArea, standard, region, stoneType, wastage.blocks));
  }

  // Perimeter wall (linear)
  if (projectType === 'perimeter_wall') {
    const wallVol = perimeter * height * 0.2;
    const blocks = withWastage(Math.ceil(perimeter * height * 10), wastage.blocks);
    const cBags = Math.ceil(wallVol * 6);
    materials.push(makeLine('pw_blocks', 'Concrete Blocks (6")', 'walls', blocks, 'pieces', applyStandard({ min: 18, max: 28 }, standard)));
    materials.push(makeLine('pw_cement', 'Cement', 'walls', cBags, '50kg bags', applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard)));
    materials.push(makeLine('pw_pillars', 'Steel Rebar Pillars', 'walls', Math.ceil(perimeter / 3), 'sets', applyStandard(STEEL_PRICES[steelGrade], standard)));
  }

  // Septic tank
  if (projectType === 'septic_tank') {
    materials.push(makeLine('st_cement',  'Cement (Tank)',    'foundation', 40,  '50kg bags', applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard)));
    materials.push(makeLine('st_sand',    'Sand',             'foundation',  4,  'tonnes',    applyStandard(resolveRegionPrices(region, BASE_SAND_PRICE, 'sand'), standard)));
    materials.push(makeLine('st_blocks',  'Concrete Blocks',  'walls',      120, 'pieces',    applyStandard({ min: 18, max: 28 }, standard)));
    materials.push(makeLine('st_rebar',   'Steel Rebar (Y12)','foundation',  12, 'lengths',   applyStandard(STEEL_PRICES.y12, standard)));
    materials.push(makeLine('st_cover',   'Manhole Cover',    'misc',         1, 'unit',      { min: 4500, max: 8000 }));
  }

  // Water tower
  if (projectType === 'water_tower') {
    const vol = area * height;
    const bags = Math.ceil(vol * 8);
    materials.push(makeLine('wt_cement', 'Cement (Tank)', 'foundation', bags, '50kg bags', applyStandard(resolveRegionPrices(region, BASE_CEMENT_PRICE, 'cement'), standard)));
    materials.push(makeLine('wt_rebar',  'Steel Rebar',   'foundation', Math.ceil(vol * 4), 'lengths', applyStandard(STEEL_PRICES[steelGrade], standard)));
    materials.push(makeLine('wt_tank',   'GRP Water Tank / Steel', 'misc', 1, 'unit', applyStandard({ min: 35000, max: 120000 }, standard)));
    materials.push(makeLine('wt_pipes',  'HDPE Pipes & Fittings', 'misc', Math.ceil(height * 2), 'pieces', { min: 800, max: 1500 }));
  }

  // Roofing
  if (needs(['roofing', 'full_house', 'bungalow', 'maisonette', 'commercial_shop']) || (isBuilding && projectType !== 'apartment')) {
    if (projectType !== 'perimeter_wall' && projectType !== 'septic_tank' && projectType !== 'water_tower') {
      materials.push(...calculateRoofing(area, perimeter, length, width, roofType, ironSheetGauge, overhang, standard, wastage.roofing, wastage.timber));
    }
  }

  // Flooring
  if (needs(['flooring', 'full_house', 'bungalow', 'maisonette', 'apartment', 'commercial_shop'])) {
    materials.push(...calculateFlooring(area, floors, tileType, standard, region, wastage.tiles));
  }

  const total_min = materials.reduce((s, m) => s + m.subtotal_min, 0);
  const total_max = materials.reduce((s, m) => s + m.subtotal_max, 0);
  const totalCement = materials.filter(m => m.name.toLowerCase().includes('cement')).reduce((s, m) => s + m.quantity, 0);
  const roofLine = materials.find(m => m.id === 'r_sheets');
  const roofCoverage = roofLine ? roofLine.quantity * 0.7 : 0;

  return {
    area_sqm:            Math.round(area * 100) / 100,
    perimeter_m:         Math.round(perimeter * 100) / 100,
    wall_area_sqm:       Math.round(wallArea * 100) / 100,
    net_wall_area_sqm:   Math.round(netWallArea * 100) / 100,
    materials,
    total_min,
    total_max,
    cost_per_sqm_min:    area > 0 ? Math.round(total_min / area) : 0,
    cost_per_sqm_max:    area > 0 ? Math.round(total_max / area) : 0,
    cement_bags_per_sqm: area > 0 ? Math.round((totalCement / area) * 10) / 10 : 0,
    roofing_coverage_sqm: Math.round(roofCoverage),
    notes:               generateNotes(config),
    warnings:            generateWarnings(config),
  };
}

// ── ─────────────────────────────────────────────────────────
// SECTION 4: HELPERS
// ────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function getCategoryColor(cat: MaterialLine['category']): string {
  const map = { foundation: '#e67e22', walls: '#2d6a4f', roofing: '#3498db', flooring: '#9b59b6', misc: '#7f8c8d' };
  return map[cat] ?? '#7f8c8d';
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ── ─────────────────────────────────────────────────────────
// SECTION 5: SUB-COMPONENTS
// ────────────────────────────────────────────────────────────

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}

function StatBox({ label, value, sub, color = 'var(--green)' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--bg-card, #fff)', borderRadius: 12, padding: '12px 16px',
      border: '1px solid var(--border, #e5e7eb)', display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--text-3, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontWeight: 800, fontSize: '1.1rem', color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      {sub && <span style={{ fontSize: '0.7rem', color: 'var(--text-3, #9ca3af)' }}>{sub}</span>}
    </div>
  );
}

function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
        {data.filter(d => d.value > 0).map((d, i) => (
          <div key={i} style={{
            width: `${(d.value / total) * 100}%`, background: d.color,
            transition: 'width 400ms ease', minWidth: d.value > 0 ? 4 : 0,
          }} title={`${d.label}: ${Math.round((d.value / total) * 100)}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 8 }}>
        {data.filter(d => d.value > 0).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-3, #9ca3af)' }}>
              {d.label} {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableRow({
  item,
  onUpdate,
}: {
  item: MaterialLine;
  onUpdate: (id: string, field: 'qty' | 'price_min' | 'price_max', value: number) => void;
}) {
  const qty = item.qty_override ?? item.quantity;
  const pMin = item.price_min_override ?? item.price_min;
  const pMax = item.price_max_override ?? item.price_max;

  return (
    <tr>
      <td style={{ fontWeight: 600, color: 'var(--text, #1a1a1a)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: getCategoryColor(item.category), flexShrink: 0 }} />
          {item.name}
        </div>
      </td>
      <td>
        <input
          type="number" value={qty} min={0}
          onChange={e => onUpdate(item.id, 'qty', parseFloat(e.target.value) || 0)}
          style={{
            width: 70, padding: '4px 6px', border: '1px solid var(--border, #e5e7eb)',
            borderRadius: 6, fontSize: '0.82rem', textAlign: 'right', background: 'var(--bg-muted, #f9fafb)',
          }}
        />
      </td>
      <td style={{ color: 'var(--text-3, #9ca3af)', fontSize: '0.8rem' }}>{item.unit}</td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <input type="number" value={pMin} min={0}
            onChange={e => onUpdate(item.id, 'price_min', parseFloat(e.target.value) || 0)}
            style={{ width: 80, padding: '4px 6px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, fontSize: '0.8rem', textAlign: 'right', background: 'var(--bg-muted, #f9fafb)' }}
          />
          <span style={{ color: 'var(--text-3, #9ca3af)', alignSelf: 'center' }}>–</span>
          <input type="number" value={pMax} min={0}
            onChange={e => onUpdate(item.id, 'price_max', parseFloat(e.target.value) || 0)}
            style={{ width: 80, padding: '4px 6px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, fontSize: '0.8rem', textAlign: 'right', background: 'var(--bg-muted, #f9fafb)' }}
          />
        </div>
      </td>
      <td style={{ fontWeight: 600, color: '#2d6a4f', fontVariantNumeric: 'tabular-nums' }}>{fmt(qty * pMin)}</td>
      <td style={{ fontWeight: 600, color: '#e67e22', fontVariantNumeric: 'tabular-nums' }}>{fmt(qty * pMax)}</td>
    </tr>
  );
}

// ── ─────────────────────────────────────────────────────────
// SECTION 6: MAIN COMPONENT
// ────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: EstimatorConfig = {
  projectType: 'full_house',
  standard: 'standard',
  region: 'nairobi',
  length: '',
  width: '',
  height: 3,
  floors: 1,
  roofType: 'gable',
  foundationType: 'strip',
  ironSheetGauge: '28g',
  tileType: 'ceramic',
  stoneType: 'machine_cut',
  steelGrade: 'y12',
  unitSystem: 'metric',
  doors: 3,
  windows: 6,
  overhang: 0.5,
  wastage: { ...DEFAULT_WASTAGE },
} as any;

export default function Estimator() {
  const [config, setConfig] = useState<EstimatorConfig>(DEFAULT_CONFIG as EstimatorConfig);
  const [rawLength, setRawLength] = useState('');
  const [rawWidth,  setRawWidth]  = useState('');
  const [error,     setError]     = useState('');
  const [result,    setResult]    = useState<EstimatorOutput | null>(null);
  const [editableMaterials, setEditableMaterials] = useState<MaterialLine[]>([]);
  const [savedEstimates, setSavedEstimates] = useState<SavedEstimate[]>(() => {
    try { return JSON.parse(localStorage.getItem('mjengo_estimates') || '[]'); } catch { return []; }
  });
  const [showAdvanced,    setShowAdvanced]    = useState(false);
  const [showSaved,       setShowSaved]       = useState(false);
  const [activeTab,       setActiveTab]       = useState<'boq' | 'charts' | 'metrics'>('boq');
  const [collapsedCats,   setCollapsedCats]   = useState<Set<string>>(new Set());
  const resultRef = useRef<HTMLDivElement>(null);

  const set = useCallback(<K extends keyof EstimatorConfig>(key: K, val: EstimatorConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  }, []);

  const setWastage = useCallback((key: keyof WastageConfig, val: number) => {
    setConfig(prev => ({ ...prev, wastage: { ...prev.wastage, [key]: val } }));
  }, []);

  const liveL = parseFloat(rawLength);
  const liveW = parseFloat(rawWidth);
  const hasLiveDims = !isNaN(liveL) && !isNaN(liveW) && liveL > 0 && liveW > 0;
  const liveArea = hasLiveDims ? (config.unitSystem === 'imperial' ? feetToMeters(liveL) * feetToMeters(liveW) : liveL * liveW) : 0;
  const livePerim = hasLiveDims ? (config.unitSystem === 'imperial' ? 2 * (feetToMeters(liveL) + feetToMeters(liveW)) : 2 * (liveL + liveW)) : 0;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const l = parseFloat(rawLength);
    const w = parseFloat(rawWidth);
    if (!rawLength || !rawWidth || isNaN(l) || isNaN(w)) { setError('Please enter both length and width.'); return; }
    if (l <= 0 || w <= 0) { setError('Dimensions must be greater than 0.'); return; }
    if (l > 500 || w > 500) { setError('Dimensions seem too large (max 500m / 1640ft).'); return; }
    const finalConfig = { ...config, length: l, width: w };
    const out = runCalculation(finalConfig);
    setResult(out);
    setEditableMaterials(out.materials.map(m => ({ ...m })));
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleMaterialUpdate = useCallback((id: string, field: 'qty' | 'price_min' | 'price_max', value: number) => {
    setEditableMaterials(prev => prev.map(m => {
      if (m.id !== id) return m;
      if (field === 'qty')       return { ...m, qty_override: value, subtotal_min: value * (m.price_min_override ?? m.price_min), subtotal_max: value * (m.price_max_override ?? m.price_max) };
      if (field === 'price_min') return { ...m, price_min_override: value, subtotal_min: (m.qty_override ?? m.quantity) * value };
      if (field === 'price_max') return { ...m, price_max_override: value, subtotal_max: (m.qty_override ?? m.quantity) * value };
      return m;
    }));
  }, []);

  const recomputedTotals = useMemo(() => ({
    total_min: editableMaterials.reduce((s, m) => s + m.subtotal_min, 0),
    total_max: editableMaterials.reduce((s, m) => s + m.subtotal_max, 0),
  }), [editableMaterials]);

  const handleSave = () => {
    if (!result) return;
    const label = prompt('Name this estimate (e.g. "Plot A - Main House"):') || `Estimate ${Date.now()}`;
    const entry: SavedEstimate = {
      id: Date.now().toString(), label, timestamp: Date.now(),
      config: { ...config, length: parseFloat(rawLength), width: parseFloat(rawWidth) },
      result,
    };
    const updated = [entry, ...savedEstimates];
    setSavedEstimates(updated);
    try { localStorage.setItem('mjengo_estimates', JSON.stringify(updated)); } catch {}
  };

  const handleExportCSV = () => {
    if (!editableMaterials.length) return;
    const rows = [
      ['Material', 'Qty', 'Unit', 'Price Min (KES)', 'Price Max (KES)', 'Subtotal Min', 'Subtotal Max'],
      ...editableMaterials.map(m => [
        m.name, m.qty_override ?? m.quantity, m.unit,
        m.price_min_override ?? m.price_min, m.price_max_override ?? m.price_max,
        m.subtotal_min.toFixed(0), m.subtotal_max.toFixed(0),
      ]),
      ['TOTAL', '', '', '', '', recomputedTotals.total_min.toFixed(0), recomputedTotals.total_max.toFixed(0)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'mjengo_estimate.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    editableMaterials.forEach(m => {
      cats[m.category] = (cats[m.category] || 0) + (m.subtotal_min + m.subtotal_max) / 2;
    });
    return Object.entries(cats).map(([cat, val]) => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: val,
      color: getCategoryColor(cat as MaterialLine['category']),
    }));
  }, [editableMaterials]);

  const groupedMaterials = useMemo(() => {
    const groups: Record<string, MaterialLine[]> = {};
    editableMaterials.forEach(m => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [editableMaterials]);

  const toggleCat = (cat: string) => {
    setCollapsedCats(prev => {
      const s = new Set(prev);
      s.has(cat) ? s.delete(cat) : s.add(cat);
      return s;
    });
  };

  const unitLabel = config.unitSystem === 'imperial' ? 'ft' : 'm';
  const stdColor = STANDARD_MULTIPLIERS[config.standard].color;

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--bg, #f8f9fa)', minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui)' }}>

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1b3a2d 0%, #2d6a4f 60%, #52b788 100%)',
        padding: '2.5rem 1.5rem 3rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(82,183,136,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
               
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', color: '#fff', fontWeight: 700, marginBottom: 8, lineHeight: 1.2 }}>
                Material Estimation Module
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.9rem', maxWidth: 520, lineHeight: 1.6 }}>
                Detailed Bill of Quantities with Kenyan market rates, regional adjustments, quality standards, and live validation.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowSaved(s => !s)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem',
                  backdropFilter: 'blur(4px)',
                }}
              >
                📁 Saved ({savedEstimates.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* SAVED ESTIMATES PANEL */}
        {showSaved && savedEstimates.length > 0 && (
          <div style={{
            background: 'var(--bg-card, #fff)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem',
            border: '1px solid var(--border, #e5e7eb)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: 'var(--text, #1a1a1a)' }}>📁 Saved Estimates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savedEstimates.map(est => (
                <div key={est.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: 'var(--bg-muted, #f9fafb)', borderRadius: 8,
                  border: '1px solid var(--border, #e5e7eb)',
                }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text, #1a1a1a)' }}>{est.label}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-3, #9ca3af)' }}>
                      {new Date(est.timestamp).toLocaleDateString('en-KE')} · {est.config.length}×{est.config.width}{unitLabel} · {fmt(est.result.total_min)}–{fmt(est.result.total_max)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSavedEstimates(prev => prev.filter(e => e.id !== est.id));
                      try { localStorage.setItem('mjengo_estimates', JSON.stringify(savedEstimates.filter(e => e.id !== est.id))); } catch {}
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3, #9ca3af)', fontSize: '1rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INPUT FORM */}
        <div style={{ background: 'var(--bg-card, #fff)', borderRadius: 16, padding: '1.75rem', marginBottom: '1.75rem', border: '1px solid var(--border, #e5e7eb)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <form onSubmit={handleCalculate}>

            {/* PROJECT TYPE GRID */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3, #9ca3af)', marginBottom: 12 }}>
                Project Type *
              </label>
              {['Residential', 'Commercial', 'Partial', 'Civil'].map(group => (
                <div key={group} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{group}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {PROJECT_TYPES.filter(p => p.group === group).map(({ value, label, icon, desc }) => (
                      <button
                        key={value} type="button"
                        onClick={() => set('projectType', value)}
                        style={{
                          padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          border: `2px solid ${config.projectType === value ? '#2d6a4f' : 'var(--border, #e5e7eb)'}`,
                          background: config.projectType === value ? '#f0faf4' : 'var(--bg-muted, #f9fafb)',
                          transition: 'all 120ms', outline: 'none', minWidth: 110,
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{icon}</div>
                        <p style={{ fontWeight: 700, fontSize: '0.78rem', color: config.projectType === value ? '#2d6a4f' : 'var(--text, #1a1a1a)', marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-3, #9ca3af)', lineHeight: 1.3 }}>{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* STANDARD & REGION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-3, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Construction Standard
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['economy', 'standard', 'premium'] as ConstructionStandard[]).map(s => (
                    <button key={s} type="button" onClick={() => set('standard', s)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${config.standard === s ? STANDARD_MULTIPLIERS[s].color : 'var(--border, #e5e7eb)'}`,
                        background: config.standard === s ? `${STANDARD_MULTIPLIERS[s].color}18` : 'var(--bg-muted, #f9fafb)',
                        fontWeight: 700, fontSize: '0.78rem', color: config.standard === s ? STANDARD_MULTIPLIERS[s].color : 'var(--text-2, #374151)',
                        transition: 'all 120ms', outline: 'none',
                      }}>
                      {STANDARD_MULTIPLIERS[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-3, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Region / Location
                </label>
                <select
                  value={config.region}
                  onChange={e => set('region', e.target.value as Region)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.88rem', background: 'var(--bg-muted, #f9fafb)', cursor: 'pointer' }}
                >
                  {(Object.entries(REGION_ADJUSTMENTS) as [Region, typeof REGION_ADJUSTMENTS[Region]][]).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-3, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Unit System
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['metric', 'imperial'] as UnitSystem[]).map(u => (
                    <button key={u} type="button" onClick={() => set('unitSystem', u)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${config.unitSystem === u ? '#2d6a4f' : 'var(--border, #e5e7eb)'}`,
                        background: config.unitSystem === u ? '#f0faf4' : 'var(--bg-muted, #f9fafb)',
                        fontWeight: 700, fontSize: '0.78rem', color: config.unitSystem === u ? '#2d6a4f' : 'var(--text-2, #374151)',
                        transition: 'all 120ms', outline: 'none',
                      }}>
                      {u === 'metric' ? 'Metric (m)' : 'Imperial (ft)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DIMENSIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: '1.25rem' }}>
              {[
                { label: `Length (${unitLabel}) *`, value: rawLength, setter: (v: string) => { setRawLength(v); setError(''); }, placeholder: config.unitSystem === 'imperial' ? 'e.g. 40' : 'e.g. 12', min: 1, max: 500, step: '0.5' },
                { label: `Width (${unitLabel}) *`, value: rawWidth, setter: (v: string) => { setRawWidth(v); setError(''); }, placeholder: config.unitSystem === 'imperial' ? 'e.g. 30' : 'e.g. 10', min: 1, max: 500, step: '0.5' },
              ].map(({ label, value, setter, placeholder, min, max, step }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>{label}</label>
                  <input type="number" value={value} onChange={e => setter(e.target.value)}
                    placeholder={placeholder} min={min} max={max} step={step}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.88rem', background: 'var(--bg-muted, #f9fafb)', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Wall Height ({unitLabel})</label>
                <input type="number" value={config.height} onChange={e => set('height', parseFloat(e.target.value) || 3)}
                  min={2} max={15} step={0.5}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.88rem', background: 'var(--bg-muted, #f9fafb)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Floors (1–50)</label>
                <input type="number" value={config.floors} onChange={e => set('floors', parseFloat(e.target.value) || 1)}
                  min={1} max={50} step={0.5}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.88rem', background: 'var(--bg-muted, #f9fafb)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Doors (openings)</label>
                <input type="number" value={config.doors} onChange={e => set('doors', parseInt(e.target.value) || 0)} min={0} max={50}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.88rem', background: 'var(--bg-muted, #f9fafb)', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Windows (openings)</label>
                <input type="number" value={config.windows} onChange={e => set('windows', parseInt(e.target.value) || 0)} min={0} max={100}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.88rem', background: 'var(--bg-muted, #f9fafb)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* LIVE PREVIEW */}
            {hasLiveDims && (
              <div style={{
                background: 'linear-gradient(90deg, #f0faf4, #f8fffe)',
                borderRadius: 10, padding: '12px 16px', marginBottom: '1.25rem',
                border: '1px solid rgba(45,106,79,0.2)', display: 'flex', gap: '2rem', flexWrap: 'wrap',
              }}>
                {[
                  { label: 'Floor Area', value: `${liveArea.toFixed(1)} m²` },
                  { label: 'Perimeter', value: `${livePerim.toFixed(1)} m` },
                  { label: 'Wall Area', value: `${(livePerim * config.height * config.floors).toFixed(1)} m²` },
                  { label: 'Net Wall (less openings)', value: `${Math.max(0, livePerim * config.height * config.floors - (config.doors * 2.1 * 0.9) - (config.windows * 1.2)).toFixed(1)} m²` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-3, #9ca3af)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ fontWeight: 800, color: '#2d6a4f', fontSize: '1rem' }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ADVANCED SETTINGS TOGGLE */}
            <button type="button" onClick={() => setShowAdvanced(a => !a)}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, border: '1px dashed var(--border, #e5e7eb)',
                background: 'transparent', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-3, #9ca3af)',
                fontWeight: 600, marginBottom: '1.25rem', transition: 'all 120ms',
              }}>
              {showAdvanced ? '▲ Hide Advanced Settings' : '▼ Advanced Settings — Material Options, Roof, Foundation, Wastage'}
            </button>

            {showAdvanced && (
              <div style={{
                background: 'var(--bg-muted, #f9fafb)', borderRadius: 12, padding: '1.25rem',
                border: '1px solid var(--border, #e5e7eb)', marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

                  {/* Roof Type */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Roof Type</label>
                    <select value={config.roofType} onChange={e => set('roofType', e.target.value as RoofType)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}>
                      {Object.entries(ROOF_SLOPE_MULTIPLIERS).map(([k, v]) => <option key={k} value={k}>{v.label} (×{v.factor})</option>)}
                    </select>
                  </div>

                  {/* Foundation */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Foundation Type</label>
                    <select value={config.foundationType} onChange={e => set('foundationType', e.target.value as FoundationType)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}>
                      <option value="strip">Strip Footing</option>
                      <option value="raft">Raft Foundation</option>
                      <option value="pad">Pad Foundation</option>
                    </select>
                  </div>

                  {/* Iron Sheets */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Iron Sheet Gauge</label>
                    <select value={config.ironSheetGauge} onChange={e => set('ironSheetGauge', e.target.value as IronSheetGauge)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}>
                      {Object.entries(IRON_SHEET_PRICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>

                  {/* Tiles */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Tile Type</label>
                    <select value={config.tileType} onChange={e => set('tileType', e.target.value as TileType)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}>
                      {Object.entries(TILE_PRICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>

                  {/* Stone Type */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Wall Material</label>
                    <select value={config.stoneType} onChange={e => set('stoneType', e.target.value as StoneType)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}>
                      <option value="machine_cut">Machine-Cut Stone</option>
                      <option value="quarry">Quarry Stone / Concrete Block</option>
                    </select>
                  </div>

                  {/* Steel Grade */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Steel Grade</label>
                    <select value={config.steelGrade} onChange={e => set('steelGrade', e.target.value as SteelGrade)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.85rem', background: '#fff' }}>
                      {Object.entries(STEEL_PRICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>

                  {/* Overhang */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-2, #374151)', marginBottom: 5 }}>Roof Overhang ({unitLabel})</label>
                    <input type="number" value={config.overhang} onChange={e => set('overhang', parseFloat(e.target.value) || 0.5)}
                      min={0} max={2} step={0.1}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, fontSize: '0.85rem', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Wastage Controls */}
                <div style={{ marginTop: '1.25rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-2, #374151)', marginBottom: 10 }}>Wastage Allowances (%)</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                    {(Object.keys(config.wastage) as (keyof WastageConfig)[]).map(key => (
                      <div key={key}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.76rem', color: 'var(--text-3, #9ca3af)', marginBottom: 4 }}>
                          <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                          <span style={{ color: '#2d6a4f' }}>{config.wastage[key]}%</span>
                        </label>
                        <input type="range" min={0} max={30} step={1} value={config.wastage[key]}
                          onChange={e => setWastage(key, parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#2d6a4f' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{
                flex: 2, padding: '13px', background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: '#fff', fontWeight: 700, fontSize: '1rem', borderRadius: 10,
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                📐 Calculate Materials
              </button>
              {result && (
                <button type="button" onClick={() => { setResult(null); setRawLength(''); setRawWidth(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ flex: 1, padding: '13px', background: 'var(--bg-muted, #f9fafb)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-2, #374151)' }}>
                  ↺ Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* RESULTS */}
        {result && (
          <div ref={resultRef} style={{ animation: 'fadeIn 0.35s ease' }}>

            {/* WARNINGS */}
            {result.warnings.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 16px', marginBottom: '1.25rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', marginBottom: 8 }}>⚠️ Engineering Checks</p>
                {result.warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.6, marginBottom: 4 }}>{w}</p>
                ))}
              </div>
            )}

            {/* SUMMARY STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
              <StatBox label="Floor Area"            value={`${result.area_sqm} m²`}       />
              <StatBox label="Perimeter"             value={`${result.perimeter_m} m`}      />
              <StatBox label="Net Wall Area"         value={`${result.net_wall_area_sqm} m²`} sub={`${result.doors}d + ${config.windows}w deducted`} />
              <StatBox label="Min. Estimate"         value={fmt(recomputedTotals.total_min)} color="#2d6a4f" />
              <StatBox label="Max. Estimate"         value={fmt(recomputedTotals.total_max)} color="#e67e22" />
              <StatBox label="Cost / m² (min–max)"   value={`${fmt(result.cost_per_sqm_min)}`} sub={`up to ${fmt(result.cost_per_sqm_max)}/m²`} />
              <StatBox label="Cement / m²"           value={`${result.cement_bags_per_sqm} bags`} sub="per floor sqm" />
              {result.roofing_coverage_sqm > 0 && <StatBox label="Roofing Coverage" value={`${result.roofing_coverage_sqm} m²`} />}
            </div>

            {/* BUDGET BAR */}
            <div style={{ background: 'var(--bg-card, #fff)', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border, #e5e7eb)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text, #1a1a1a)' }}>💡 Budget Range</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Pill label={STANDARD_MULTIPLIERS[config.standard].label} color={stdColor} />
                  <Pill label={REGION_ADJUSTMENTS[config.region].label}     color="#3498db" />
                </div>
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1a1a1a', marginBottom: 12 }}>
                <span style={{ color: '#2d6a4f' }}>{fmt(recomputedTotals.total_min)}</span>
                <span style={{ color: '#9ca3af', margin: '0 10px', fontWeight: 400 }}>–</span>
                <span style={{ color: '#e67e22' }}>{fmt(recomputedTotals.total_max)}</span>
              </div>
              <MiniBarChart data={categoryBreakdown} />
            </div>

            {/* TABS */}
            <div style={{ background: 'var(--bg-card, #fff)', borderRadius: 16, border: '1px solid var(--border, #e5e7eb)', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-muted, #f9fafb)' }}>
                {([['boq', '📋 Bill of Quantities'], ['charts', '📊 Cost Breakdown'], ['metrics', '📈 Metrics']] as [typeof activeTab, string][]).map(([tab, label]) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontWeight: 700,
                      fontSize: '0.82rem', background: activeTab === tab ? 'var(--bg-card, #fff)' : 'transparent',
                      color: activeTab === tab ? '#2d6a4f' : 'var(--text-3, #9ca3af)',
                      borderBottom: activeTab === tab ? '2px solid #2d6a4f' : '2px solid transparent',
                      transition: 'all 120ms',
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* BOQ TAB */}
              {activeTab === 'boq' && (
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3, #9ca3af)' }}>Quantities and prices are editable — totals recalculate instantly.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={handleSave}
                        style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-muted, #f9fafb)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        💾 Save
                      </button>
                      <button type="button" onClick={handleExportCSV}
                        style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-muted, #f9fafb)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        📥 CSV
                      </button>
                    </div>
                  </div>

                  {Object.entries(groupedMaterials).map(([cat, items]) => {
                    const isCollapsed = collapsedCats.has(cat);
                    const catMin = items.reduce((s, m) => s + m.subtotal_min, 0);
                    const catMax = items.reduce((s, m) => s + m.subtotal_max, 0);
                    return (
                      <div key={cat} style={{ marginBottom: 16, border: '1px solid var(--border, #e5e7eb)', borderRadius: 10, overflow: 'hidden' }}>
                        <button type="button" onClick={() => toggleCat(cat)}
                          style={{
                            width: '100%', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: `${getCategoryColor(cat)}14`, border: 'none', cursor: 'pointer',
                          }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: getCategoryColor(cat) }} />
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: getCategoryColor(cat), textTransform: 'capitalize' }}>{cat}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-3, #9ca3af)' }}>{items.length} item{items.length > 1 ? 's' : ''}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-2, #374151)', fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(catMin)} – {fmt(catMax)}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-3, #9ca3af)' }}>{isCollapsed ? '▼' : '▲'}</span>
                          </div>
                        </button>
                        {!isCollapsed && (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                              <thead>
                                <tr style={{ background: 'var(--bg-muted, #f9fafb)' }}>
                                  {['Material', 'Qty', 'Unit', 'Unit Price (KES)', 'Min Subtotal', 'Max Subtotal'].map(h => (
                                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', color: 'var(--text-3, #9ca3af)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {items.map(item => (
                                  <EditableRow key={item.id} item={item} onUpdate={handleMaterialUpdate} />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Totals row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, padding: '12px 14px', background: 'var(--bg-muted, #f9fafb)', borderRadius: 10, border: '1px solid var(--border, #e5e7eb)' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text, #1a1a1a)' }}>TOTAL ESTIMATE</span>
                    <span style={{ fontWeight: 800, color: '#2d6a4f', fontVariantNumeric: 'tabular-nums' }}>{fmt(recomputedTotals.total_min)}</span>
                    <span style={{ color: 'var(--text-3, #9ca3af)' }}>–</span>
                    <span style={{ fontWeight: 800, color: '#e67e22', fontVariantNumeric: 'tabular-nums' }}>{fmt(recomputedTotals.total_max)}</span>
                  </div>
                </div>
              )}

              {/* CHARTS TAB */}
              {activeTab === 'charts' && (
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.9rem', color: 'var(--text, #1a1a1a)' }}>Material Category Breakdown</h4>
                  <MiniBarChart data={categoryBreakdown} />

                  <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem', color: 'var(--text, #1a1a1a)' }}>Min vs Max by Category</h4>
                      {Object.entries(groupedMaterials).map(([cat, items]) => {
                        const catMin = items.reduce((s, m) => s + m.subtotal_min, 0);
                        const catMax = items.reduce((s, m) => s + m.subtotal_max, 0);
                        const pct = recomputedTotals.total_max > 0 ? (catMax / recomputedTotals.total_max) * 100 : 0;
                        return (
                          <div key={cat} style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: '0.76rem', fontWeight: 600, color: getCategoryColor(cat), textTransform: 'capitalize' }}>{cat}</span>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-3, #9ca3af)', fontVariantNumeric: 'tabular-nums' }}>{fmt(catMin)} – {fmt(catMax)}</span>
                            </div>
                            <div style={{ height: 8, background: 'var(--bg-muted, #f9fafb)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: getCategoryColor(cat), borderRadius: 4, transition: 'width 400ms ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div>
                      <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem', color: 'var(--text, #1a1a1a)' }}>Cost Distribution</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Materials (Min)', value: recomputedTotals.total_min, color: '#2d6a4f' },
                          { label: 'Materials (Max)', value: recomputedTotals.total_max, color: '#e67e22' },
                          { label: 'Midpoint Estimate', value: (recomputedTotals.total_min + recomputedTotals.total_max) / 2, color: '#3498db' },
                          { label: 'Est. Labour (15%)', value: recomputedTotals.total_min * 0.15, color: '#9b59b6' },
                          { label: 'Contingency (10%)', value: recomputedTotals.total_max * 0.10, color: '#e74c3c' },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: `${color}0e`, borderRadius: 8, border: `1px solid ${color}22` }}>
                            <span style={{ fontSize: '0.8rem', color, fontWeight: 600 }}>{label}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{fmt(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* METRICS TAB */}
              {activeTab === 'metrics' && (
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
                    <StatBox label="Cost per m² (min)" value={fmt(result.cost_per_sqm_min)} sub="materials only" />
                    <StatBox label="Cost per m² (max)" value={fmt(result.cost_per_sqm_max)} sub="materials only" color="#e67e22" />
                    <StatBox label="Cement bags / m²"  value={`${result.cement_bags_per_sqm}`} sub="all cement combined" />
                    {result.roofing_coverage_sqm > 0 && <StatBox label="Roof coverage" value={`${result.roofing_coverage_sqm} m²`} sub="sheets × 0.7m eff. width" />}
                    <StatBox label="Total floor area"  value={`${(result.area_sqm * config.floors).toFixed(1)} m²`} sub={`${config.floors} floor(s)`} />
                    <StatBox label="Net wall area"     value={`${result.net_wall_area_sqm} m²`} sub="after opening deductions" />
                  </div>
                  <div style={{ padding: '14px 16px', background: '#f0faf4', borderRadius: 10, border: '1px solid rgba(45,106,79,0.2)' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2d6a4f', marginBottom: 6 }}>📐 Industry Benchmarks (Nairobi, {STANDARD_MULTIPLIERS[config.standard].label})</p>
                    <p style={{ fontSize: '0.8rem', color: '#374151', lineHeight: 1.7 }}>
                      Economy: KES 25,000–40,000/m² · Standard: KES 40,000–65,000/m² · Premium: KES 65,000–120,000/m²
                      <br />Your estimate: <strong style={{ color: '#2d6a4f' }}>{fmt(result.cost_per_sqm_min)}–{fmt(result.cost_per_sqm_max)}/m²</strong> (materials only, excluding labour)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* NOTES */}
            <div style={{ background: 'var(--bg-card, #fff)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid var(--border, #e5e7eb)' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text, #1a1a1a)', marginBottom: 10 }}>ℹ️ Notes & Assumptions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.notes.map((note, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-3, #9ca3af)', lineHeight: 1.5 }}>
                    <span style={{ color: '#2d6a4f', flexShrink: 0 }}>•</span>
                    {note}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* DISCLAIMER */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: '0.78rem', lineHeight: 1.6, color: '#92400e' }}>
          <span style={{ flexShrink: 0 }}>⚠️</span>
          <span>
            <strong>Disclaimer:</strong> All estimates are approximate and based on average Kenyan market rates as of 2024. Actual costs vary by location, supplier, quality, and site conditions. Labour excluded. Obtain formal quotations from at least 3 suppliers before committing to a budget.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        input[type="number"]::-webkit-inner-spin-button { opacity: 0.5; }
        input[type="range"] { cursor: pointer; }
      `}</style>
    </div>
  );
}