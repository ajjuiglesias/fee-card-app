export interface Tutor {
  id: string;
  full_name: string;
  phone: string;
  business_name: string;
  upi_id: string;
}

export interface AuthResponse {
  message: string;
  tutor: Tutor;
}