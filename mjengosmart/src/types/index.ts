// ============================================================
// MjengoSmart — TypeScript Type Definitions
// Integrated GIS System for Construction Resource Optimization
// ============================================================

// ── Auth & Users ────────────────────────────────────────────

export type UserRole = 'client' | 'supplier' | 'worker' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  location_name?: string;
}

// ── Suppliers ────────────────────────────────────────────────

export interface Supplier {
  id: number;
  user: number;
  business_name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  phone: string;
  email: string;
  opening_hours: string;
  is_open_now: boolean;
  distance_km?: number;
  materials_count?: number;
  owner_name?: string;
}

// ── Materials ────────────────────────────────────────────────

export type MaterialCategory =
  | 'Cement'
  | 'Steel'
  | 'Timber'
  | 'Sand'
  | 'Roofing'
  | 'Tiles'
  | 'Paint'
  | 'Electrical'
  | 'Plumbing'
  | 'Other';

export interface Material {
  id: number;
  supplier: number;
  supplier_name?: string;
  supplier_location?: string;
  name: string;
  description: string;
  category: MaterialCategory;
  price: number;
  unit: string;
  stock_quantity: number;
  image?: string;
  is_in_stock?: boolean;
}

// ── Workers ──────────────────────────────────────────────────

export type SkillType =
  | 'Mason'
  | 'Plumber'
  | 'Electrician'
  | 'Carpenter'
  | 'Painter'
  | 'Welder'
  | 'Tiler'
  | 'Roofer'
  | 'General Labour'
  | 'Supervisor';

export interface Worker {
  id: number;
  user: number;
  full_name?: string;
  skill_type: SkillType;
  bio: string;
  daily_rate: number;
  experience_years: number;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  is_available: boolean;
  portfolio_url?: string;
  distance_km?: number;
  reviews_count?: number;
  location_name?: string;
}

// ── Orders ───────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: number;
  client: number;
  client_name?: string;
  material: number;
  material_name?: string;
  material_unit?: string;
  supplier_name?: string;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  delivery_address: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderData {
  material: number;
  quantity: number;
  delivery_address: string;
  notes?: string;
}

// ── Bookings ─────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed';

export interface BookingRequest {
  id: number;
  client: number;
  client_name?: string;
  worker: number;
  worker_name?: string;
  worker_skill?: string;
  start_date: string;
  end_date: string;
  description: string;
  agreed_rate: number;
  status: BookingStatus;
  created_at: string;
  total_days?: number;
  total_cost?: number;
}

export interface CreateBookingData {
  worker: number;
  start_date: string;
  end_date: string;
  description: string;
  agreed_rate: number;
}

// ── Reviews ──────────────────────────────────────────────────

export type ReviewTargetType = 'supplier' | 'worker';

export interface Review {
  id: number;
  reviewer: number;
  reviewer_name?: string;
  target_type: ReviewTargetType;
  target_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CreateReviewData {
  target_type: ReviewTargetType;
  target_id: number;
  rating: number;
  comment: string;
}

// ── Notifications ────────────────────────────────────────────

export type NotifType =
  | 'order_update'
  | 'booking_request'
  | 'review_received'
  | 'system';

export interface Notification {
  id: number;
  user: number;
  notif_type: NotifType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ── Analytics ────────────────────────────────────────────────

export interface AnalyticsData {
  total_orders: number;
  pending_orders: number;
  delivered_orders: number;
  total_spent: number;
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  unread_notifications: number;
  // supplier/worker specific
  total_materials?: number;
  total_revenue?: number;
  avg_rating?: number;
  reviews_count?: number;
}

// ── Material Estimator ───────────────────────────────────────

export interface EstimatorInput {
  project_type: 'foundation' | 'walls' | 'roof' | 'flooring' | 'full_house';
  length_m: number;
  width_m: number;
  height_m?: number;
  num_floors?: number;
  wall_thickness?: 'half_brick' | 'full_brick';
}

export interface EstimatorResult {
  area_sqm: number;
  volume_m3?: number;
  materials: EstimatorLineItem[];
  estimated_cost_min: number;
  estimated_cost_max: number;
  notes: string[];
}

export interface EstimatorLineItem {
  material: string;
  quantity: number;
  unit: string;
  unit_price_min: number;
  unit_price_max: number;
  total_min: number;
  total_max: number;
}

// ── GIS / Geocoding ──────────────────────────────────────────

export interface GeoLocation {
  lat: number;
  lng: number;
  label?: string;
}

export interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    county?: string;
    country?: string;
  };
}

// ── Pagination ───────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── API Error ────────────────────────────────────────────────

export interface ApiError {
  detail?: string;
  message?: string;
  [field: string]: string | string[] | undefined;
}