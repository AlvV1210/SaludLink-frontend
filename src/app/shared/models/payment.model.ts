export interface ProcessPaymentRequest {
  amount: number;
  paymentMethod: string;
  cardLast4?: string;
}

export interface PaymentResponse {
  id: number;
  appointmentId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  receiptNumber: string;
  paidAt: string;
}
