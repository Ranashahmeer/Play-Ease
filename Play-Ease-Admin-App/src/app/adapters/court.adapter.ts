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
      
      bookedSlots: this.parseBookedSlots(item.bookedslots),
      OwnerId: item.OwnerID
    };
  }

  private static timeStringToMinutes(time: string): number {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private parseImages(images: any): string[] {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    return images.split(',').map((img: string) => img.trim());
  }

  private parseOffers(offers: any): string[] {
    if (!offers) return [];
    if (Array.isArray(offers)) return offers;
    return offers.split(',').map((o: string) => o.trim());
  }

  private parsePitches(pitches: any): Pitch[] {
    if (!pitches) return [];
    try {
      return typeof pitches === 'string' ? JSON.parse(pitches) : pitches;
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
