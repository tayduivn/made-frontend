// Stylist profile

export interface StylistProfile {
  id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  salon_name: string;
  salon_address: string;
  profile_photo_id?: string;
  profile_photo_url?: string;
}

export interface ServiceInSummary {
  name: string;
  base_price: number;
  duration_minutes: number;
}

export interface WorkdayInSummary {
  weekday_iso: number; // 1..7
  is_available: boolean;
  work_start_at: string; // time of day formatted as hh:mm:ss
  work_end_at: string;   // time of day formatted as hh:mm:ss
  booked_time_minutes: number;
}

export interface StylistSummary {
  profile: StylistProfile;
  services: ServiceInSummary[];
  services_count: number;
  worktime: WorkdayInSummary[];
  total_week_booked_minutes: number;
}

// Weekday discounts

export interface WeekdayDiscount {
  label: string;
  weekday_iso: number;
  discount_percent: number;
}

export interface WeekdayDiscounts {
  weekdays: WeekdayDiscount[];
}

// Other discounts

export interface SimpleDiscounts {
  first_visit_discount_percent: number;
  repeat_within_1_week_discount_percent: number;
  repeat_within_2_week_discount_percent: number;
}

// Service templates

export interface ServicesTemplate {
  uuid?: string;
  name: string;
  description: string;
  image_url: string;
  services: ServiceName[];
}

export interface ServiceName {
  name: string;
}

export interface ServiceTemplateSet {
  id?: number;
  name: string;
  description: string;
  categories: ServiceCategory[];
}

export interface ServiceCategory {
  uuid: string;
  name: string;
  services: ServiceTemplateItem[];
}

export interface ServiceTemplateItem {
  categoryUuid?: string;

  id?: number;
  name: string;
  description: string;
  base_price: number;
  duration_minutes: number;
}

export interface ServiceTemplateSets {
  sets: ServiceTemplateSet[];
}

// Services
export interface ServiceItem extends ServiceTemplateItem {
  is_enabled: boolean;
  photo_samples: ServicesPhotoSample[];
}

export interface ServicesPhotoSample {
  url: string;
}