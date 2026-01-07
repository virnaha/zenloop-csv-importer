import { AnswerPayload, AnswerResponse, AdditionalQuestionsResponse } from '@/types';

/**
 * Post an answer to zenloop via our API route
 */
export async function postAnswer(
  surveyHashId: string,
  answer: AnswerPayload
): Promise<AnswerResponse> {
  const response = await fetch('/api/zenloop/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ surveyHashId, answer }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get additional questions for a survey
 */
export async function getAdditionalQuestions(
  surveyHashId: string
): Promise<AdditionalQuestionsResponse> {
  const response = await fetch(
    `/api/zenloop/questions?surveyHashId=${encodeURIComponent(surveyHashId)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Post an additional answer
 */
export async function postAdditionalAnswer(
  answerId: string,
  questionId: string,
  answer: string | string[]
): Promise<void> {
  const response = await fetch('/api/zenloop/additional-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answerId,
      additionalAnswer: {
        answer,
        question_id: questionId,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}
