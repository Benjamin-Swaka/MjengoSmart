// ============================================================
// MjengoSmart — API Service Layer
// All HTTP communication with the Django DRF backend
// ============================================================

import type {
  AuthTokens,
  LoginCredentials,
  RegisterData,
  User,
  Supplier,
  Material,
  MaterialCategory,
  Worker,
  Order,
  CreateOrderData,
  BookingRequest,
  CreateBookingData,
  Review,
  CreateReviewData,
  Notification,
  AnalyticsData,
  GeocodeResult,
} from '../types';

// ── Base Configuration ───────────────────────────────────────
// Local dev: VITE_API_URL is unset, so this falls back to '/api',
// which Vite's dev-server proxy (vite.config.ts) forwards to Django
// on http://127.0.0.1:8000 — nothing changes for local development.
//
// Production (Render): set VITE_API_URL as a Static Site environment
// variable, e.g. https://mjengosmart-backend.onrender.com/api
// Vite bakes this in at build time (see .env.production), so the
// deployed frontend calls the deployed backend directly — there is
// no proxy in production, since the frontend is a static site.

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ── Token Service ────────────────────────────────────────────

export const tokenService = {
  getAccess: (): string | null => localStorage.getItem('access_token'),
  getRefresh: (): string | null => localStorage.getItem('refresh_token'),

  set: (tokens: AuthTokens): void => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  },

  clear: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isExpired: (token: string): boolean => {
    try {
      const payloadRaw = token.split('.')[1];
      const normalized = payloadRaw
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(payloadRaw.length / 4) * 4, '=');
      const payload = JSON.parse(atob(normalized));
      return Date.now() >= (payload.exp ?? 0) * 1000;
    } catch {
      return true;
    }
  },
};

async function refreshAccessToken(): Promise<string | null> {
  const refresh = tokenService.getRefresh();
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      tokenService.clear();
      return null;
    }

    const data = await res.json();
    if (!data.access) {
      tokenService.clear();
      return null;
    }

    const nextRefresh = data.refresh ?? refresh;
    tokenService.set({ access: data.access, refresh: nextRefresh });
    return data.access;
  } catch {
    tokenService.clear();
    return null;
  }
}

// ── HTTP Client ──────────────────────────────────────────────

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Attach access token
  if (!skipAuth) {
    let token = tokenService.getAccess();

    // Auto-refresh if missing or expired
    if (!token || tokenService.isExpired(token)) {
      token = await refreshAccessToken();
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      tokenService.clear();
    }
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return filtered.length ? `?${filtered.join('&')}` : '';
}

// ── Auth Service ─────────────────────────────────────────────

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens & { user: User }> => {
    const data = await request<AuthTokens & { user: User }>(
      '/auth/login/',
      { method: 'POST', body: JSON.stringify(credentials), skipAuth: true }
    );
    tokenService.set({ access: data.access, refresh: data.refresh });
    return data;
  },

  register: async (data: RegisterData): Promise<AuthTokens & { user: User }> => {
    const result = await request<AuthTokens & { user: User }>(
      '/auth/register/',
      { method: 'POST', body: JSON.stringify(data), skipAuth: true }
    );
    tokenService.set({ access: result.access, refresh: result.refresh });
    return result;
  },

  logout: (): void => {
    tokenService.clear();
  },

  refresh: async (): Promise<boolean> => {
    return !!(await refreshAccessToken());
  },

  isLoggedIn: (): boolean => {
    const token = tokenService.getAccess();
    return !!token && !tokenService.isExpired(token);
  },

  getMe: (): Promise<User> => request<User>('/auth/me/'),

  updateProfile: (data: Partial<User>): Promise<User> =>
    request<User>('/auth/me/', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Analytics Service ────────────────────────────────────────

export const analyticsService = {
  get: (): Promise<AnalyticsData> => request<AnalyticsData>('/auth/analytics/'),
};

// ── Supplier Service ─────────────────────────────────────────

export const supplierService = {
  getAll: (params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    search?: string;
  }): Promise<Supplier[]> => {
    const q = params ? buildQuery(params as Record<string, string | number | boolean | undefined>) : '';
    return request<Supplier[]>(`/suppliers/${q}`);
  },

  getById: (id: number): Promise<Supplier & { materials: Material[] }> =>
    request(`/suppliers/${id}/`),

  getInventory: (id: number, category?: MaterialCategory): Promise<Material[]> => {
    const q = category ? `?category=${category}` : '';
    return request<Material[]>(`/suppliers/${id}/inventory/${q}`);
  },
};

// ── Material Service ─────────────────────────────────────────

export const materialService = {
  getAll: (params?: {
    category?: MaterialCategory | string;
    max_price?: number;
    search?: string;
    supplier?: number;
  }): Promise<Material[]> => {
    const q = params ? buildQuery(params as Record<string, string | number | boolean | undefined>) : '';
    return request<Material[]>(`/materials/${q}`);
  },

  getById: (id: number): Promise<Material> => request<Material>(`/materials/${id}/`),

  create: (data: Partial<Material>): Promise<Material> =>
    request<Material>('/materials/', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: Partial<Material>): Promise<Material> =>
    request<Material>(`/materials/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    request<void>(`/materials/${id}/`, { method: 'DELETE' }),
};

// ── Worker Service ───────────────────────────────────────────

export const workerService = {
  getAll: (params?: {
    lat?: number;
    lng?: number;
    skill?: string;
    available?: boolean;
    search?: string;
  }): Promise<Worker[]> => {
    const q = params ? buildQuery(params as Record<string, string | number | boolean | undefined>) : '';
    return request<Worker[]>(`/workers/${q}`);
  },

  getById: (id: number): Promise<Worker> => request<Worker>(`/workers/${id}/`),
};

// ── Order Service ────────────────────────────────────────────

export const orderService = {
  getAll: (): Promise<Order[]> => request<Order[]>('/orders/'),

  getById: (id: number): Promise<Order> => request<Order>(`/orders/${id}/`),

  create: (data: CreateOrderData): Promise<Order> =>
    request<Order>('/orders/', { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (id: number, status: string): Promise<Order> =>
    request<Order>(`/orders/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  cancel: (id: number): Promise<Order> =>
    request<Order>(`/orders/${id}/`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }),
};

// ── Booking Service ──────────────────────────────────────────

export const bookingService = {
  getAll: (): Promise<BookingRequest[]> => request<BookingRequest[]>('/bookings/'),

  getById: (id: number): Promise<BookingRequest> =>
    request<BookingRequest>(`/bookings/${id}/`),

  create: (data: CreateBookingData): Promise<BookingRequest> =>
    request<BookingRequest>('/bookings/', { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (id: number, status: string): Promise<BookingRequest> =>
    request<BookingRequest>(`/bookings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ── Review Service ───────────────────────────────────────────

export const reviewService = {
  getForTarget: (targetType: string, targetId: number): Promise<Review[]> =>
    request<Review[]>(`/reviews/?target_type=${targetType}&target_id=${targetId}`),

  create: (data: CreateReviewData): Promise<Review> =>
    request<Review>('/reviews/', { method: 'POST', body: JSON.stringify(data) }),

  getMyReviews: (): Promise<Review[]> => request<Review[]>('/reviews/mine/'),
};

// ── Notification Service ─────────────────────────────────────

export const notificationService = {
  getAll: (): Promise<Notification[]> => request<Notification[]>('/notifications/'),

  markAllRead: (): Promise<void> =>
    request<void>('/notifications/mark_all_read/', { method: 'POST' }),

  markRead: (id: number): Promise<void> =>
    request<void>(`/notifications/${id}/mark_read/`, { method: 'POST' }),

  getUnreadCount: async (): Promise<number> => {
    const notifications = await request<Notification[]>('/notifications/');
    return notifications.filter((n) => !n.is_read).length;
  },
};

// ── Supplier Detail Service (convenience) ────────────────────

export const supplierDetailService = {
  get: (id: number) => supplierService.getById(id),
  inventory: (id: number, category?: MaterialCategory) =>
    supplierService.getInventory(id, category),
};

// ── Geocode Service (OpenStreetMap Nominatim) ─────────────────

export const geocodeService = {
  search: async (query: string): Promise<GeocodeResult[]> => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'MjengoSmart/1.0' },
    });
    return response.json();
  },

  reverse: async (lat: number, lon: number): Promise<GeocodeResult> => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'MjengoSmart/1.0' },
    });
    return response.json();
  },
};

// ── Material Estimator (client-side calculation) ──────────────
// Supports Objective 1: Material Estimation Module

export interface EstimatorParams {
  project_type: 'foundation' | 'walls' | 'roof' | 'flooring' | 'full_house';
  length_m: number;
  width_m: number;
  height_m: number;
  num_floors: number;
}

export interface EstimatorOutput {
  area_sqm: number;
  perimeter_m: number;
  wall_area_sqm: number;
  materials: {
    name: string;
    quantity: number;
    unit: string;
    price_min: number;
    price_max: number;
    subtotal_min: number;
    subtotal_max: number;
  }[];
  total_min: number;
  total_max: number;
  notes: string[];
}

export const estimatorService = {
  calculate: (params: EstimatorParams): EstimatorOutput => {
    const { length_m, width_m, height_m, num_floors } = params;
    const area = length_m * width_m;
    const perimeter = 2 * (length_m + width_m);
    const wallArea = perimeter * height_m * num_floors;
    const notes: string[] = [];

    // Base material requirements per m²/m³ (Kenyan construction standards)
    const materials: EstimatorOutput['materials'] = [];

    if (params.project_type === 'foundation' || params.project_type === 'full_house') {
      // Foundation concrete: depth 0.6m, width 0.5m
      const foundationVol = perimeter * 0.6 * 0.5;
      materials.push({
        name: 'Cement (Foundation)',
        quantity: Math.ceil(foundationVol * 7),
        unit: '50kg bags',
        price_min: 700, price_max: 850,
        subtotal_min: Math.ceil(foundationVol * 7) * 700,
        subtotal_max: Math.ceil(foundationVol * 7) * 850,
      });
      materials.push({
        name: 'Sand (Foundation)',
        quantity: Math.ceil(foundationVol * 0.5),
        unit: 'tonnes',
        price_min: 2500, price_max: 3500,
        subtotal_min: Math.ceil(foundationVol * 0.5) * 2500,
        subtotal_max: Math.ceil(foundationVol * 0.5) * 3500,
      });
      materials.push({
        name: 'Hardcore / Ballast',
        quantity: Math.ceil(foundationVol * 0.8),
        unit: 'tonnes',
        price_min: 2000, price_max: 3000,
        subtotal_min: Math.ceil(foundationVol * 0.8) * 2000,
        subtotal_max: Math.ceil(foundationVol * 0.8) * 3000,
      });
      notes.push('Foundation assumes 600mm depth × 500mm width strip footing.');
    }

    if (params.project_type === 'walls' || params.project_type === 'full_house') {
      const bricks = Math.ceil(wallArea * 55); // ~55 bricks per m² for 9" wall
      materials.push({
        name: 'Bricks / Blocks',
        quantity: bricks,
        unit: 'pieces',
        price_min: 18, price_max: 28,
        subtotal_min: bricks * 18,
        subtotal_max: bricks * 28,
      });
      const cementBags = Math.ceil(wallArea * 0.3);
      materials.push({
        name: 'Cement (Walls)',
        quantity: cementBags,
        unit: '50kg bags',
        price_min: 700, price_max: 850,
        subtotal_min: cementBags * 700,
        subtotal_max: cementBags * 850,
      });
      const sandTonnes = Math.ceil(wallArea * 0.04);
      materials.push({
        name: 'Sand (Mortar)',
        quantity: sandTonnes,
        unit: 'tonnes',
        price_min: 2500, price_max: 3500,
        subtotal_min: sandTonnes * 2500,
        subtotal_max: sandTonnes * 3500,
      });
      notes.push('Block count includes 10% wastage allowance.');
    }

    if (params.project_type === 'roofing' || params.project_type === 'full_house') {
      const roofArea = area * 1.25; // 25% extra for pitch/overhang
      const sheets = Math.ceil(roofArea / 0.7); // iron sheets 0.7m coverage
      materials.push({
        name: 'Iron Sheets (28G)',
        quantity: sheets,
        unit: 'sheets',
        price_min: 650, price_max: 900,
        subtotal_min: sheets * 650,
        subtotal_max: sheets * 900,
      });
      const timber = Math.ceil(roofArea * 0.15);
      materials.push({
        name: 'Timber (Purlins/Rafters)',
        quantity: timber,
        unit: 'pcs (2"×6")',
        price_min: 600, price_max: 900,
        subtotal_min: timber * 600,
        subtotal_max: timber * 900,
      });
      notes.push('Roof area calculated with 25% slope allowance.');
    }

    if (params.project_type === 'flooring' || params.project_type === 'full_house') {
      const tilesNeeded = Math.ceil(area * num_floors * 1.1);
      materials.push({
        name: 'Floor Tiles (600×600mm)',
        quantity: tilesNeeded,
        unit: 'pcs',
        price_min: 55, price_max: 150,
        subtotal_min: tilesNeeded * 55,
        subtotal_max: tilesNeeded * 150,
      });
      const cementFloor = Math.ceil(area * num_floors * 0.15);
      materials.push({
        name: 'Cement (Screed)',
        quantity: cementFloor,
        unit: '50kg bags',
        price_min: 700, price_max: 850,
        subtotal_min: cementFloor * 700,
        subtotal_max: cementFloor * 850,
      });
    }

    const total_min = materials.reduce((s, m) => s + m.subtotal_min, 0);
    const total_max = materials.reduce((s, m) => s + m.subtotal_max, 0);

    notes.push('Prices are estimates based on current Nairobi market rates.');
    notes.push('Labour costs not included — use the Workers section to hire skilled fundis.');

    return {
      area_sqm: Math.round(area * 100) / 100,
      perimeter_m: Math.round(perimeter * 100) / 100,
      wall_area_sqm: Math.round(wallArea * 100) / 100,
      materials,
      total_min,
      total_max,
      notes,
    };
  },
};