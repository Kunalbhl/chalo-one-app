import { RideOption, FoodItem, MartItem, HotelOption, LeaderboardUser } from "./types";

export const RIDE_CATALOG: RideOption[] = [
  { platform: 'Uber', vehicleType: 'Bike', eta: 3, price: 45, driverRating: 4.8, cancellationPolicy: 'Free cancellation within 5 mins' },
  { platform: 'Rapido', vehicleType: 'Bike', eta: 2, price: 38, driverRating: 4.7, cancellationPolicy: 'Free cancellation within 2 mins' },
  { platform: 'Ola', vehicleType: 'Bike', eta: 5, price: 42, driverRating: 4.6, cancellationPolicy: 'Cancellation charges apply' },
  
  { platform: 'Uber', vehicleType: 'Auto', eta: 4, price: 75, driverRating: 4.5, cancellationPolicy: 'Free cancellation within 3 mins' },
  { platform: 'Ola', vehicleType: 'Auto', eta: 3, price: 72, driverRating: 4.2, cancellationPolicy: 'No refund after OTP generated' },
  { platform: 'Namma Yatri', vehicleType: 'Auto', eta: 6, price: 65, driverRating: 4.9, cancellationPolicy: 'Zero cancellation charge' },

  { platform: 'Uber', vehicleType: 'Mini', eta: 6, price: 140, driverRating: 4.4, cancellationPolicy: 'Free within 5 mins' },
  { platform: 'Ola', vehicleType: 'Mini', eta: 5, price: 135, driverRating: 4.3, cancellationPolicy: 'Cancellation fees apply' },

  { platform: 'Uber', vehicleType: 'Sedan', eta: 5, price: 180, driverRating: 4.7, cancellationPolicy: 'Free cancellation within 5 mins' },
  { platform: 'Ola', vehicleType: 'Sedan', eta: 8, price: 175, driverRating: 4.5, cancellationPolicy: 'Free cancellation within 5 mins' },
  { platform: 'BluSmart', vehicleType: 'Sedan', eta: 12, price: 210, driverRating: 4.9, cancellationPolicy: 'No cancellation charges, guaranteed clean EV' },

  { platform: 'Uber', vehicleType: 'SUV', eta: 7, price: 280, driverRating: 4.8, cancellationPolicy: 'Free within 5 mins' },
  { platform: 'Ola', vehicleType: 'SUV', eta: 9, price: 275, driverRating: 4.6, cancellationPolicy: 'Free within 5 mins' },

  { platform: 'Uber', vehicleType: 'Premium', eta: 5, price: 320, driverRating: 4.9, cancellationPolicy: 'Free within 10 mins' },
  { platform: 'BluSmart', vehicleType: 'Premium', eta: 15, price: 350, driverRating: 4.95, cancellationPolicy: 'Guaranteed premium EV, zero surge' }
];

export const FOOD_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    name: 'Special Chicken Dum Biryani',
    restaurant: 'Behrouz Biryani',
    platform: 'Swiggy',
    price: 349,
    deliveryFee: 35,
    discount: 50,
    deliveryTime: 35,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: false
  },
  {
    id: 'f2',
    name: 'Special Chicken Dum Biryani',
    restaurant: 'Behrouz Biryani',
    platform: 'Zomato',
    price: 339,
    deliveryFee: 20,
    discount: 60,
    deliveryTime: 30,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: false
  },
  {
    id: 'f3',
    name: 'Special Chicken Dum Biryani',
    restaurant: 'Behrouz Biryani',
    platform: 'EatSure',
    price: 310,
    deliveryFee: 0,
    discount: 40,
    deliveryTime: 28,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: false
  },
  {
    id: 'f4',
    name: 'Paneer Butter Masala',
    restaurant: 'Punjab Grill',
    platform: 'Swiggy',
    price: 280,
    deliveryFee: 40,
    discount: 50,
    deliveryTime: 40,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: true
  },
  {
    id: 'f5',
    name: 'Paneer Butter Masala',
    restaurant: 'Punjab Grill',
    platform: 'Zomato',
    price: 270,
    deliveryFee: 30,
    discount: 40,
    deliveryTime: 35,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: true
  },
  {
    id: 'f6',
    name: 'Butter Chicken combo with Naan',
    restaurant: 'Moti Mahal Delux',
    platform: 'Zomato',
    price: 320,
    deliveryFee: 25,
    discount: 80,
    deliveryTime: 32,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: false
  },
  {
    id: 'f7',
    name: 'Butter Chicken combo with Naan',
    restaurant: 'Moti Mahal Delux',
    platform: 'Swiggy',
    price: 340,
    deliveryFee: 45,
    discount: 100,
    deliveryTime: 38,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: false
  },
  {
    id: 'f8',
    name: 'Veg Loaded Pizza (9 inch)',
    restaurant: 'La Pinoz Pizza',
    platform: 'Zomato',
    price: 249,
    deliveryFee: 35,
    discount: 30,
    deliveryTime: 25,
    rating: 4.1,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: true
  },
  {
    id: 'f9',
    name: 'Veg Loaded Pizza (9 inch)',
    restaurant: 'La Pinoz Pizza',
    platform: 'Swiggy',
    price: 259,
    deliveryFee: 40,
    discount: 50,
    deliveryTime: 28,
    rating: 4.1,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: true
  },
  {
    id: 'f10',
    name: 'Peri Peri Crispy Fries',
    restaurant: 'Zepto Cafe',
    platform: 'Zepto Cafe',
    price: 110,
    deliveryFee: 15,
    discount: 20,
    deliveryTime: 12,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isVeg: true
  }
];

export const MART_ITEMS: MartItem[] = [
  {
    id: 'm1',
    name: 'Amul Gold Full Cream Milk',
    brand: 'Amul',
    weightVolume: '500 ml',
    category: 'Dairy & Eggs',
    dietType: 'Veg',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    prices: [
      { platform: 'Blinkit', price: 34, discountedPrice: 33, deliveryTime: 8, inStock: true },
      { platform: 'Zepto', price: 34, discountedPrice: 32, deliveryTime: 10, inStock: true },
      { platform: 'Instamart', price: 34, discountedPrice: 34, deliveryTime: 12, inStock: true },
      { platform: 'JioMart', price: 34, discountedPrice: 31, deliveryTime: 45, inStock: true },
      { platform: 'BigBasket', price: 34, discountedPrice: 31.5, deliveryTime: 60, inStock: true }
    ]
  },
  {
    id: 'm2',
    name: 'Harvest Gold White Bread',
    brand: 'Harvest Gold',
    weightVolume: '400 g',
    category: 'Bakery',
    dietType: 'Veg',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    prices: [
      { platform: 'Blinkit', price: 40, discountedPrice: 38, deliveryTime: 7, inStock: true },
      { platform: 'Zepto', price: 40, discountedPrice: 39, deliveryTime: 9, inStock: true },
      { platform: 'Instamart', price: 40, discountedPrice: 38, deliveryTime: 11, inStock: false },
      { platform: 'JioMart', price: 43, discountedPrice: 36, deliveryTime: 40, inStock: true }
    ]
  },
  {
    id: 'm3',
    name: 'Britannia Good Day Butter Cookies',
    brand: 'Britannia',
    weightVolume: '200 g',
    category: 'Snacks',
    dietType: 'Veg',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    prices: [
      { platform: 'Blinkit', price: 40, discountedPrice: 35, deliveryTime: 9, inStock: true },
      { platform: 'Zepto', price: 40, discountedPrice: 33, deliveryTime: 8, inStock: true },
      { platform: 'Instamart', price: 40, discountedPrice: 34, deliveryTime: 12, inStock: true },
      { platform: 'BigBasket', price: 40, discountedPrice: 30, deliveryTime: 90, inStock: true }
    ]
  },
  {
    id: 'm4',
    name: 'Fortune Soya Health Oil',
    brand: 'Fortune',
    weightVolume: '1 L',
    category: 'Staples',
    dietType: 'Veg',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    prices: [
      { platform: 'Blinkit', price: 165, discountedPrice: 135, deliveryTime: 12, inStock: true },
      { platform: 'Zepto', price: 165, discountedPrice: 132, deliveryTime: 11, inStock: true },
      { platform: 'Instamart', price: 165, discountedPrice: 138, deliveryTime: 15, inStock: true },
      { platform: 'JioMart', price: 165, discountedPrice: 125, deliveryTime: 45, inStock: true },
      { platform: 'BigBasket', price: 165, discountedPrice: 127, deliveryTime: 50, inStock: true }
    ]
  },
  {
    id: 'm5',
    name: 'Surf Excel Easy Wash Detergent Powder',
    brand: 'Surf Excel',
    weightVolume: '1 kg',
    category: 'Household',
    dietType: 'Veg',
    image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    prices: [
      { platform: 'Blinkit', price: 150, discountedPrice: 138, deliveryTime: 10, inStock: true },
      { platform: 'Zepto', price: 150, discountedPrice: 135, deliveryTime: 11, inStock: true },
      { platform: 'Instamart', price: 150, discountedPrice: 139, deliveryTime: 14, inStock: true },
      { platform: 'JioMart', price: 150, discountedPrice: 124, deliveryTime: 50, inStock: true },
      { platform: 'BigBasket', price: 150, discountedPrice: 126, deliveryTime: 75, inStock: true }
    ]
  },
  {
    id: 'm6',
    name: 'Suguna Farm Fresh White Eggs',
    brand: 'Suguna',
    weightVolume: '6 pcs',
    category: 'Dairy & Eggs',
    dietType: 'Eggetarian',
    image: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    prices: [
      { platform: 'Blinkit', price: 54, discountedPrice: 48, deliveryTime: 8, inStock: true },
      { platform: 'Zepto', price: 54, discountedPrice: 49, deliveryTime: 7, inStock: true },
      { platform: 'Instamart', price: 54, discountedPrice: 50, deliveryTime: 11, inStock: true }
    ]
  },
  {
    id: 'm7',
    name: 'ITC Master Chef Crispy Chicken Nuggets',
    brand: 'ITC Master Chef',
    weightVolume: '250 g',
    category: 'Snacks',
    dietType: 'Non-Veg',
    image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    prices: [
      { platform: 'Blinkit', price: 180, discountedPrice: 155, deliveryTime: 10, inStock: true },
      { platform: 'Zepto', price: 180, discountedPrice: 152, deliveryTime: 9, inStock: true },
      { platform: 'Instamart', price: 180, discountedPrice: 159, deliveryTime: 12, inStock: true }
    ]
  }
];

export const HOTELS_CATALOG: HotelOption[] = [
  {
    id: 'h1',
    name: 'The Pride Hotel, Jaipur',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stars: 4,
    rating: 4.5,
    reviewsCount: 1420,
    distance: '2.5 km from City Palace',
    amenities: ['Free WiFi', 'Swimming Pool', 'Spa', 'Restaurant', 'AC', 'Bar'],
    comparisons: [
      { platform: 'Agoda', pricePerNight: 3200, taxes: 450, cancellation: 'Free cancellation before 48 hours' },
      { platform: 'Booking.com', pricePerNight: 3400, taxes: 480, cancellation: 'Free cancellation' },
      { platform: 'MakeMyTrip', pricePerNight: 3100, taxes: 600, cancellation: 'Non-Refundable, Instant ₹300 Cashback' },
      { platform: 'Cleartrip', pricePerNight: 3250, taxes: 400, cancellation: 'Free cancellation before 24 hours' }
    ]
  },
  {
    id: 'h2',
    name: 'W Goa Beach Resort',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stars: 5,
    rating: 4.8,
    reviewsCount: 2280,
    distance: 'Right on Vagator Beach',
    amenities: ['Beachfront', 'Infinity Pool', 'Nightclub', 'Gym', 'Free Valet', 'Pet Friendly'],
    comparisons: [
      { platform: 'Agoda', pricePerNight: 14500, taxes: 2600, cancellation: 'Free cancellation (Flexible)' },
      { platform: 'Booking.com', pricePerNight: 14800, taxes: 2680, cancellation: 'Free cancellation before 3 days' },
      { platform: 'MakeMyTrip', pricePerNight: 13900, taxes: 2900, cancellation: 'Non-Refundable' },
      { platform: 'Goibibo', pricePerNight: 14200, taxes: 2750, cancellation: 'Free cancellation 48h before check-in' }
    ]
  },
  {
    id: 'h3',
    name: 'Radisson Blu Resort, Udaipur',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stars: 5,
    rating: 4.6,
    reviewsCount: 1890,
    distance: '1.1 km from Lake Fateh Sagar',
    amenities: ['Lake View', 'Lounge Bar', 'Kids Club', 'AC', 'Free Breakfast', 'Airport shuttle'],
    comparisons: [
      { platform: 'Agoda', pricePerNight: 6800, taxes: 950, cancellation: 'Free cancellation 48h' },
      { platform: 'Booking.com', pricePerNight: 6950, taxes: 980, cancellation: 'Free cancellation' },
      { platform: 'MakeMyTrip', pricePerNight: 6500, taxes: 1100, cancellation: 'Non-refundable but includes Spa Voucher' },
      { platform: 'Cleartrip', pricePerNight: 6750, taxes: 920, cancellation: 'Free cancellation before 24 hours' }
    ]
  },
  {
    id: 'h4',
    name: 'Ananda Premium Suites, Delhi',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    stars: 3,
    rating: 4.2,
    reviewsCount: 650,
    distance: '0.8 km from Connaught Place',
    amenities: ['Free Breakfast', 'WiFi', 'Kitchenette', 'AC', 'Room Service'],
    comparisons: [
      { platform: 'Booking.com', pricePerNight: 2400, taxes: 320, cancellation: 'Free cancellation 24h prior' },
      { platform: 'Agoda', pricePerNight: 2350, taxes: 300, cancellation: 'Non-Refundable' },
      { platform: 'MakeMyTrip', pricePerNight: 2450, taxes: 340, cancellation: 'Free cancellation' },
      { platform: 'Cleartrip', pricePerNight: 2410, taxes: 310, cancellation: 'Free cancellation' }
    ]
  }
];

export const LEADERBOARD_WEEKLY: LeaderboardUser[] = [
  { rank: 1, name: 'Anjali Sharma', points: 14000 },
  { rank: 2, name: 'Rohan Verma', points: 12500 },
  { rank: 3, name: 'Amit Patel', points: 10500 },
  { rank: 4, name: 'Kunal P (You)', points: 8200, isMe: true }, // fits kunalpareekusa@gmail.com
  { rank: 5, name: 'Prerna Joshi', points: 7400 },
  { rank: 6, name: 'Vikram Singh', points: 6100 },
  { rank: 7, name: 'Sunita Reddy', points: 4500 }
];

export const LEADERBOARD_MONTHLY: LeaderboardUser[] = [
  { rank: 1, name: 'Rohan Verma', points: 48000 },
  { rank: 2, name: 'Anjali Sharma', points: 42500 },
  { rank: 3, name: 'Sunita Reddy', points: 36000 },
  { rank: 4, name: 'Kunal P (You)', points: 32000, isMe: true },
  { rank: 5, name: 'Amit Patel', points: 29500 },
  { rank: 6, name: 'Megha Gupta', points: 24100 },
  { rank: 7, name: 'Sanjay Kumar', points: 18400 }
];

export const LEADERBOARD_ALLTIME: LeaderboardUser[] = [
  { rank: 1, name: 'Rohan Verma', points: 280000 },
  { rank: 2, name: 'Anjali Sharma', points: 215000 },
  { rank: 3, name: 'Sanjay Kumar', points: 195000 },
  { rank: 4, name: 'Sunita Reddy', points: 164000 },
  { rank: 5, name: 'Kunal P (You)', points: 128000, isMe: true },
  { rank: 6, name: 'Karan Mehra', points: 110500 },
  { rank: 7, name: 'Nisha Gupta', points: 95000 }
];

export const FAQS = [
  {
    q: "How does Chalo aggregate Ola and Uber pricing?",
    a: "Chalo aggregates authorized rate APIs, cached route fares, and crowdsourced real-time commuter inputs to show you a live comparison. Once you choose your preferred option, we securely deep-link or book through our partner gateway."
  },
  {
    q: "How does the Unified Checkout work across Swiggy and Zomato?",
    a: "Chalo uses a smart split-payment settlement engine. You pay a single unified bill which is processed and split automatically by our payment gateways directly to the respective merchants (Swiggy, Zomato, Behrouz, etc.) for quick individual merchant fulfillments!"
  },
  {
    q: "What is the Chalo Points conversion rate?",
    a: "For every referral signup, you earn 2000 points. The conversion formula is: 20 Chalo Points = ₹1. Therefore, 2000 Points is equivalent to ₹100 of direct cashback, redeemable across stays, food checkout, rides, and instamart grocery bags!"
  },
  {
    q: "Can I pre-configure my favorite delivery apps?",
    a: "Yes! Navigate to Settings -> App Preferences. You can prioritize apps for Food, Mart, Rides, and Stays. Choose options like 'Cheapest First' or custom rank them like Zomato #1, Swiggy #2. Our system will prioritize them automatically in comparisons!"
  },
  {
    q: "What action is taken when I press the SOS button?",
    a: "The Chalo SOS trigger instantly sends your live GPS coordinates, your vehicle number, driver name, and active ride route link to your emergency contacts, local traffic command, and Chalo's 24/7 central response desk."
  }
];
