import { api } from "../lib/api";

export interface Address {
  id: number;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
  note?: string;
  is_default: boolean;
}

export interface CreateAddressRequest {
  label: string;
  address: string;
  lat?: number;
  lng?: number;
  note?: string;
}

export const addressService = {
  async getAddresses(): Promise<Address[]> {
    const response = await api.get<{ data: Address[] }>("/addresses");
    return response.data.data || [];
  },

  async addAddress(req: CreateAddressRequest): Promise<Address> {
    const response = await api.post<{ data: Address }>("/addresses", req);
    return response.data.data;
  },

  async updateAddress(id: number, req: CreateAddressRequest): Promise<Address> {
    const response = await api.put<{ data: Address }>(`/addresses/${id}`, req);
    return response.data.data;
  },

  async deleteAddress(id: number): Promise<void> {
    await api.delete(`/addresses/${id}`);
  },

  async setDefault(id: number): Promise<void> {
    await api.patch(`/addresses/${id}/default`); // Assuming patch for set default based on naming
  },
};
