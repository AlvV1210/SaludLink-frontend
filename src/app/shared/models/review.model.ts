export interface CreateReviewRequest {
  appointmentId: number;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  appointmentId: number;
  doctorId: number;
  patientName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}
