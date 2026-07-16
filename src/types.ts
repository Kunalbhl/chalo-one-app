export interface UserProfile {
  id: string;
  firebaseUid?: string;
  internalUserId?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  gender: string;
  savedAddresses: Address[];
  referralCode: string;
  referredBy?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  createdBy?: string;
  photoURL?: string;
  emailVerified?: boolean;
  suspended?: boolean;
  lastLogin?: any;
  createdAt?: any;
  updatedAt?: any;
  affiliateDetails?: {
    companyName: string;
    domain: string;
    clicks: number;
    conversions: number;
    revenue: number;
    commissionRate: number;
    apiConfigured?: boolean;
    webhookUrl?: string;
    apiToken?: string;
    isActivated?: boolean;
  };
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other' | string;
  addressLine: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export interface ChaloWallet {
  points: number; // 20 points = Re 1
  balance: number; // in Rupees
  history: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number; // in Rupees
  pointsSpentOrEarned: number;
  description: string;
  timestamp: any;
}

export interface ReferralState {
  code: string;
  pointsEarned: number;
  signupsCount: number;
  weeklyLeaderboard: LeaderboardUser[];
  monthlyLeaderboard: LeaderboardUser[];
  allTimeLeaderboard: LeaderboardUser[];
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  isMe?: boolean;
}

export interface AppPreferences {
  food: string[]; // Zomato, Swiggy, EatSure, Zepto Cafe
  mart: string[]; // Blinkit, Zepto, Swiggy Instamart, JioMart, BigBasket
  rides: string[]; // Uber, Ola, Rapido, Namma Yatri, BluSmart
  stays: string[]; // Booking.com, Agoda, MakeMyTrip, Cleartrip, EaseMyTrip, Goibibo
  preferenceMode: 'cheapest' | 'fastest' | 'rated' | 'favorites' | 'ai';
  defaultFoodType?: 'Veg' | 'Non-Veg' | 'Eggetarian' | "Doesn't Matter";
  biometricsEnabled?: boolean;
  biometricMode?: 'fingerprint' | 'faceid';
  txBiometricsEnabled?: boolean;
  securityPin?: string;
}

export interface ConnectedAccounts {
  ola: boolean;
  uber: boolean;
  rapido: boolean;
  swiggy: boolean;
  zomato: boolean;
  blinkit: boolean;
  zepto: boolean;
  booking: boolean;
  agoda: boolean;
  makemytrip: boolean;
}

// 1. Rides Interface
export interface RideOption {
  platform: 'Uber' | 'Ola' | 'Rapido' | 'Namma Yatri' | 'BluSmart';
  vehicleType: 'Bike' | 'Auto' | 'Mini' | 'Sedan' | 'SUV' | 'Premium' | 'XL';
  eta: number; // in minutes
  price: number;
  driverRating: number;
  couponApplied?: string;
  discount?: number;
  peakChargeMultiplier?: number;
  cancellationPolicy: string;
}

export interface SelectedRide {
  option: RideOption;
  pickup: string;
  destination: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  status: 'searching' | 'driver_assigned' | 'arriving' | 'active' | 'completed';
  driverLat: number;
  driverLng: number;
  otp: string;
}

// 2. Intercity Interface
export interface IntercityQuery {
  pickup: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  luggage: number;
}

export interface IntercityOption {
  vehicleType: string;
  recommended: boolean;
  reason: string;
  platform: string;
  fare: number;
  travelTime: string; // e.g., "5h 30m"
  tollCharges: number;
  fuelCost: number;
  comfortScore: number; // out of 10
  calculatedDistance?: number;
}

// 3. Food Interface
export interface FoodItem {
  id: string;
  name: string;
  restaurant: string;
  platform: 'Swiggy' | 'Zomato' | 'EatSure' | 'Zepto Cafe';
  price: number;
  deliveryFee: number;
  discount: number;
  deliveryTime: number; // in minutes
  rating: number;
  image: string;
  isVeg: boolean;
}

// 4. Mart Interface
export interface MartItem {
  id: string;
  name: string;
  brand: string;
  weightVolume: string;
  category: string;
  image: string;
  dietType?: 'Veg' | 'Non-Veg' | 'Eggetarian';
  prices: {
    platform: 'Blinkit' | 'Zepto' | 'Instamart' | 'JioMart' | 'BigBasket' | 'Swiggy Instamart';
    price: number;
    discountedPrice: number;
    deliveryTime: number; // in mins
    inStock: boolean;
  }[];
}

// 5. Stays Interface
export interface StayQuery {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export interface HotelOption {
  id: string;
  name: string;
  image: string;
  stars: number;
  rating: number;
  reviewsCount: number;
  distance: string; // e.g. "1.2 km from Center"
  amenities: string[];
  comparisons: {
    platform: 'Booking.com' | 'Agoda' | 'MakeMyTrip' | 'Cleartrip' | 'Goibibo';
    pricePerNight: number;
    taxes: number;
    cancellation: string; // e.g., "Free cancellation before 24h"
  }[];
}

// 7. Cart & Checkout
export interface UnifiedCart {
  foodItems: { item: FoodItem; quantity: number }[];
  martItems: { item: MartItem; platform: string; quantity: number }[];
  stayBooking?: { hotel: HotelOption; platform: string; query: StayQuery; totalNights: number };
}

// 12. Support Ticket
export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: any;
  messages: {
    sender: 'user' | 'support';
    text: string;
    timestamp: any;
  }[];
}

// Global Order Activity (for Activity Center)
export interface OrderActivity {
  id: string;
  category: 'rides' | 'food' | 'mart' | 'stays' | 'intercity';
  platform: string;
  merchant: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  amount: number;
  status: 'active' | 'upcoming' | 'completed' | 'cancelled';
  statusLabel: string;
  paymentMethod: string;
  etaMins?: number;
  pickupCoords?: { lat: number; lng: number };
  destCoords?: { lat: number; lng: number };
}

export interface OngoingActivity {
  id: string;
  category: 'rides' | 'food' | 'mart' | 'stays' | 'intercity';
  platform: string;
  merchant?: string;
  title: string;
  subtitle?: string;
  date: string;
  time: string;
  amount: number;
  status: 'ongoing' | 'completed' | 'cancelled';
  statusLabel?: string;
  paymentMethod?: string;
  eta?: string;
  otpConfirm?: string;
  routeString?: string;
  pickupCoords?: { lat: number; lng: number };
  destCoords?: { lat: number; lng: number };
}

export interface BiometricLog {
  id: string;
  timestamp: string; // Dynamic full timestamp
  attemptType: 'app_launch' | 'transaction';
  authMethod: 'fingerprint' | 'faceid' | 'pin';
  status: 'success' | 'failed';
  selfieUrl?: string; // webcam snapshot base64 image or dynamic high-fidelity canvas illustration
  details?: string; // location coordinate or action context description
}

export type BillCategory = 'Mobile' | 'Electricity' | 'Water' | 'Broadband' | 'Gas' | 'DTH';

export interface SavedBill {
  id: string;
  category: BillCategory;
  provider: string;
  accountNumber: string; // Phone number or Connection ID
  customerName: string;
  amountDue: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  autoPayEnabled: boolean;
  lastPaidDate?: string;
  billerName?: string;
  amount?: number;
}


