export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  stationId?: number;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: string;
  stationId?: number;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDTO;
}
