export type ListingAttribute = {
  key: string;
  label: string;
  value: string | number | boolean | null;
  unit?: string;
  group?: string;
};

export type ListingDetails = Record<string, unknown> | ListingAttribute[];

export type ListingMediaItem = {
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export type ListingLocation = {
  country?: string;
  city?: string;
  area?: string;
};

export type CompanyBranch = {
  name: string;
  city?: string;
  address?: string;
  phone?: string;
};

export type NotificationPreferences = {
  push?: {
    messages?: boolean;
    payments?: boolean;
    listings?: boolean;
    admin?: boolean;
  };
  email?: {
    invoices?: boolean;
    promotions?: boolean;
    admin?: boolean;
  };
  sms?: {
    otp?: boolean;
    criticalAlerts?: boolean;
  };
  whatsapp?: {
    otp?: boolean;
    criticalAlerts?: boolean;
  };
};

export type AdminPermission =
  | "manage_users"
  | "review_listings"
  | "manage_reports"
  | "send_notifications"
  | "manage_payments"
  | "view_analytics";
