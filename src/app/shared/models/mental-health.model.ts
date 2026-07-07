export interface MentalHealthScreeningRequest {
  answers: number[];
}

export interface MentalHealthScreeningResponse {
  score: number;
  level: string;
  message: string;
  referralOptions: string[];
}
