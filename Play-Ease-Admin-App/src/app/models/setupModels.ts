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
  pitchId: number; // ADD THIS if not present
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
  CourtId?:number,
  userId:number,
  courtPitchId: number;
  ownerId?: number;
  paymentMethodId: number;
  paymentProof: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  price: number;
}
