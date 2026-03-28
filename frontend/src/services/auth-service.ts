import { api } from "../lib/api";
import { type LoginResponse, type RegisterRequest } from "../types/auth";

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>("/login", { email, password });
    return response.data;
  },

  async register(data: RegisterRequest): Promise<void> {
    await api.post("/register", data);
  },

  async logout(): Promise<void> {
    await api.post("/logout");
  },

  async getMe(): Promise<any> {
    const response = await api.get("/me");
    return response.data;
  },
};
