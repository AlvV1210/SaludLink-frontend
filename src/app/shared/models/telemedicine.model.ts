export interface TeleconsultJoinResponse {
  appointmentId: number;
  joinUrl: string;
  roomToken: string;
  expiresAt: string;
}

export interface ConsultationMessage {
  id: number;
  appointmentId: number;
  senderUserId: number;
  senderName: string;
  message: string;
  sentAt: string;
}

export interface SendConsultationMessageRequest {
  message: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  description: string;
}
