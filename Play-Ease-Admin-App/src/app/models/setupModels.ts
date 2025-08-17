export interface Court {
  courtId: number;
  name: string;
  location: string;
  rating: number;
  openingTime: string;
  closingTime: string;
  openingMinutes: number;
  closingMinutes: number;
  about: string;
  image: string;
  images: string[];
  offers: string[];
  pitches: Pitch[];
  bookedSlots: Record<string, string[]>; // e.g. { "2025-08-17": ["10:00", "12:00"] }
  OwnerId: number;
}

export interface Pitch {
  pitchtype: string;
  price: number;
}

  
  export interface CourtOwner {
    ownerId: number;
    name: string;
    phone: string;
    email: string;
  }
  
  export interface PaymentMethod {
    methodId: number;
    ownerId: number;
    type: 'EASYPAISA' | 'JAZZCASH' | 'BANK';
    accountNumber: string;
    bankName?: string; // only if type = BANK
  }

  export interface SaveBookings {
    courtId?: number;
    ownerId?: number;
    userId: number;
    paymentMethodId: number;
    paymentProof: string;  // will send base64 string of image
    bookingDate: string;   // e.g. "2025-08-16"
    startTime: string;     // e.g. "10:00"
    endTime: string;       // e.g. "11:00"
    price: number;
  }
  