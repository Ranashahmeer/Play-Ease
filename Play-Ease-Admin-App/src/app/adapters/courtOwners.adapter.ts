// adapters/court-owner.adapter.ts
import { CourtOwner } from '../models/setupModels';
import { Adapter } from './adapter.interface';

export class CourtOwnerAdapter implements Adapter<CourtOwner> {
  fromApi(item: any): CourtOwner {
    return {
      ownerId: item.ownerid,
      name: item.name,
      phone: item.phone,
      email: item.email
    };
  }
}
