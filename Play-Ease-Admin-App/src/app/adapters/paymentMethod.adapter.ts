// adapters/payment-method.adapter.ts
import { PaymentMethod } from '../models/setupModels';
import { Adapter } from './adapter.interface';

export class PaymentMethodAdapter implements Adapter<PaymentMethod> {
  fromApi(item: any): PaymentMethod {
    return {
      methodId: item.methodid,
      ownerId: item.ownerid,
      type: item.type,
      accountNumber: item.accountnumber,
      bankName: item.bankname ?? undefined
    };
  }
}
