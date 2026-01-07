'use client';

import { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { FileUpload } from '@/components/FileUpload';
import { ProgressDisplay } from '@/components/ProgressDisplay';
import { CsvRow, ProcessingStatus, AdditionalQuestion, ValidationError } from '@/types';
import {
  buildAnswerPayload,
  getAdditionalAnswers,
  validateCSV,
  isRowValid,
} from '@/lib/csv-processor';
import {
  postAnswer,
  getAdditionalQuestions,
  postAdditionalAnswer,
} from '@/lib/zenloop-client';

const initialStatus: ProcessingStatus = {
  status: 'idle',
  totalRows: 0,
  processedRows: 0,
  validationErrors: [],
  processingErrors: [],
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [surveyHashId, setSurveyHashId] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>(initialStatus);

  // Store parsed data for "Proceed Anyway" functionality
  const parsedDataRef = useRef<{ headers: string[]; data: CsvRow[] } | null>(null);

  const reset = useCallback(() => {
    setFile(null);
    setSurveyHashId('');
    setStatus(initialStatus);
    parsedDataRef.current = null;
  }, []);

  const processRows = useCallback(async (data: CsvRow[], skipInvalid: boolean = false) => {
    setStatus(prev => ({
      ...prev,
      status: 'processing',
      totalRows: data.length,
      processedRows: 0,
      processingErrors: [],
    }));

    // Fetch additional questions once
    let additionalQuestions: AdditionalQuestion[] = [];
    try {
      const questionsResponse = await getAdditionalQuestions(surveyHashId);
      additionalQuestions = questionsResponse.additional_questions || [];
    } catch (error) {
      console.warn('Could not fetch additional questions:', error);
    }

    const errors: string[] = [];
    let processedRows = 0;

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Skip invalid rows if requested
      if (skipInvalid && !isRowValid(row)) {
        processedRows++;
        setStatus(prev => ({
          ...prev,
          processedRows,
        }));
        continue;
      }

      try {
        // Post main answer
        const answerPayload = buildAnswerPayload(row);
        const answerResponse = await postAnswer(surveyHashId, answerPayload);
        const answerId = answerResponse.answer?.id;

        // Post additional answers if we have questions and an answer ID
        if (answerId && additionalQuestions.length > 0) {
          const additionalAnswers = getAdditionalAnswers(row, additionalQuestions);

          for (const { questionId, answer } of additionalAnswers) {
            if (answer && (typeof answer === 'string' ? answer.trim() : answer.length > 0)) {
              try {
                await postAdditionalAnswer(answerId, questionId, answer);
              } catch (error) {
                console.warn(`Failed to post additional answer for row ${i + 1}:`, error);
              }
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        // Improve 401 error message
        if (message.includes('401')) {
          errors.push(`Row ${i + 1}: You are unauthorized`);
        } else {
          errors.push(`Row ${i + 1}: ${message}`);
        }
      }

      processedRows++;
      setStatus(prev => ({
        ...prev,
        processedRows,
        processingErrors: [...errors],
      }));

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setStatus(prev => ({
      ...prev,
      status: errors.length === data.length ? 'error' : 'complete',
    }));
  }, [surveyHashId]);

  const validateAndProcess = useCallback(async () => {
    if (!file || !surveyHashId) return;

    // Set validating state
    setStatus(prev => ({
      ...prev,
      status: 'validating',
      validationErrors: [],
      processingErrors: [],
    }));

    // Parse CSV
    const text = await file.text();
    const parseResult = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
    });

    const headers = parseResult.meta.fields || [];
    const data = parseResult.data;

    // Store for potential "Proceed Anyway"
    parsedDataRef.current = { headers, data };

    // Validate
    const validationErrors = validateCSV(headers, data);

    if (validationErrors.length > 0) {
      setStatus(prev => ({
        ...prev,
        status: 'validation_failed',
        totalRows: data.length,
        validationErrors,
      }));
      return;
    }

    // No validation errors - proceed to processing
    await processRows(data);
  }, [file, surveyHashId, processRows]);

  const handleProceedAnyway = useCallback(async () => {
    if (!parsedDataRef.current) return;

    const { data } = parsedDataRef.current;
    await processRows(data, true); // Skip invalid rows
  }, [processRows]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setStatus(prev => ({
        ...prev,
        processingErrors: ['Please select a CSV file'],
      }));
      return;
    }

    if (!surveyHashId.trim()) {
      setStatus(prev => ({
        ...prev,
        processingErrors: ['Please enter a Survey Hash ID'],
      }));
      return;
    }

    validateAndProcess();
  };

  // Download template handler
  const handleDownloadTemplate = () => {
    const template = `"NPS","Comment","Date","customer_id","store"
"10","Great service!","07.01.2026 10:15","12345","Berlin"
"8","Good experience","07.01.2026 11:30","12346","Munich"
"6","Could be better","","12347","Hamburg"
"9","","07.01.2026 14:00","12348","Frankfurt"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status.status !== 'idle') {
    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <svg
                className="w-8 h-8 text-blue-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <h1 className="text-2xl font-bold text-gray-800">
                zenloop CSV Importer
              </h1>
            </div>
            <ProgressDisplay
              status={status}
              onReset={reset}
              onProceedAnyway={status.status === 'validation_failed' ? handleProceedAnyway : undefined}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-6">
            <svg
              className="w-8 h-8 text-blue-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800">
              zenloop CSV Importer
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Survey Hash ID Input */}
            <div>
              <label
                htmlFor="surveyHashId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Survey Public Hash ID
              </label>
              <input
                type="text"
                id="surveyHashId"
                value={surveyHashId}
                onChange={e => setSurveyHashId(e.target.value)}
                placeholder="e.g., YmNGWHdCZkNOTmNPK0x4VFBZVTkzaGhN..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Find this in zenloop under Survey Settings
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <FileUpload
                onFileSelect={setFile}
                selectedFile={file}
                disabled={false}
              />
            </div>

            {/* Errors */}
            {status.processingErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <ul className="list-disc list-inside text-sm text-red-600">
                  {status.processingErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CSV Format Help */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Required CSV Format
                </h3>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Download Template
                </button>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <strong>NPS</strong> - Score (0-10, required)
                </li>
                <li>
                  <strong>Comment</strong> - Feedback text
                </li>
                <li>
                  <strong>Date</strong> - Format: DD.MM.YYYY HH:MM
                </li>
                <li>
                  <strong>[Q1], [Q2], ...</strong> - Additional questions
                </li>
                <li>Other columns become properties</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!file || !surveyHashId.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload and Import
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
