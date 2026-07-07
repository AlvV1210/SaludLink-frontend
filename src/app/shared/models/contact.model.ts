export interface ContactMessageRequest {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  topic?: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  receivedAt: string;
}
