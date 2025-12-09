// adapters/court.adapter.ts
import { Court, Pitch } from '../models/setupModels';
import { Adapter } from './adapter.interface';

export class CourtAdapter implements Adapter<Court> {
  fromApi(item: any): Court {
    const openingMinutes = CourtAdapter.timeStringToMinutes(item.openingtime);
    const closingMinutes = CourtAdapter.timeStringToMinutes(item.closingtime);

    return {
      courtId: item.courtid,
      name: item.NAME,
      location: item.location,
      rating: Number(item.rating) || 0,
      openingTime: item.openingtime,
      closingTime: item.closingtime,
      openingMinutes,
      closingMinutes,
      about: item.about,
      image: item.mainimage,
      images: this.parseImages(item.images),
      offers: this.parseOffers(item.offers),
      pitches: this.parsePitches(item.pitches),
      OwnerId: item.ownerid || item.OwnerID || item.ownerId || 0,
      bookedSlots: this.parseBookedSlots(item.bookedslots),
      ownerName: item.fullname || item.FullName || '',
      ownerPhone: item.Phone || item.phone || ''
    };
  }


  private static timeStringToMinutes(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private parseImages(images: any): string[] {
    if (!images) return [];

    // Handle JSON string from API  
    if (typeof images === 'string') {
      try {
        const parsed = JSON.parse(images);
        if (Array.isArray(parsed)) {
          return parsed.map((img: any) => img.imageurl || img.ImageUrl || img);
        }
        // Fallback for comma-separated string
        return images.split(',').map((img: string) => img.trim());
      } catch {
        // If JSON parse fails, try comma-separated
        return images.split(',').map((img: string) => img.trim());
      }
    }

    // Handle array
    if (Array.isArray(images)) {
      return images.map((img: any) => {
        if (typeof img === 'string') return img;
        return img.imageurl || img.ImageUrl || '';
      }).filter(img => img); // Remove empty strings
    }

    return [];
  }

  private parseOffers(offers: any): string[] {
    if (!offers) return [];
    if (Array.isArray(offers)) return offers;
    return offers.split(',').map((o: string) => o.trim());
  }

  /*  */
  // adapters/court.adapter.ts
  private parsePitches(pitches: any): Pitch[] {
    if (!pitches) return [];
    try {
      const parsed = typeof pitches === 'string' ? JSON.parse(pitches) : pitches;
      // Ensure each pitch has required fields
      return parsed.map((p: any) => ({
        pitchId: p.pitchId || p.pitchid || 0,
        pitchtype: p.pitchtype || p.pitchType || '',
        price: Number(p.price) || 0
      }));
    } catch {
      return [];
    }
  }
  private parseBookedSlots(slots: any): Record<string, string[]> {
    if (!slots) return {};
    try {
      return typeof slots === 'string' ? JSON.parse(slots) : slots;
    } catch {
      return {};
    }
  }
}
