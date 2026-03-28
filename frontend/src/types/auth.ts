export interface InfoResponse {
  name: string;
  email: string;
  role: string;
  phone: string;
  avatar: string;
}

export interface LoginResponse {
  message: string;
  info: InfoResponse;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "user" | "rest" | "admin" | "rider";
}
