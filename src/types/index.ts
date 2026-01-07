export interface CsvRow {
  NPS?: string;
  Comment?: string;
  Date?: string;
  [key: string]: string | undefined;
}

export interface AnswerPayload {
  answer_score: string;
  response: string;
  properties: Record<string, string>;
  inserted_at: string;
}

export interface AdditionalQuestion {
  public_hash_id: string;
  question: string;
  position: number;
  type: string;
  options: string[];
}

export interface AdditionalQuestionsResponse {
  additional_questions: AdditionalQuestion[];
}

export interface AnswerResponse {
  answer: {
    id: string;
  };
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ProcessingStatus {
  status: 'idle' | 'validating' | 'validation_failed' | 'processing' | 'complete' | 'error';
  totalRows: number;
  processedRows: number;
  validationErrors: ValidationError[];
  processingErrors: string[];
}
