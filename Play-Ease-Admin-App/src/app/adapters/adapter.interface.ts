
export interface Adapter<T> {
    fromApi(item: any): T;
  }
  