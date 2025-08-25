export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: number;
}

export interface ShippingAddress {
  id?: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}