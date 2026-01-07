'use client';

import { ProcessingStatus } from '@/types';

interface ProgressDisplayProps {
  status: ProcessingStatus;
  onReset: () => void;
  onProceedAnyway?: () => void;
}

export function ProgressDisplay({ status, onReset, onProceedAnyway }: ProgressDisplayProps) {
  const progress =
    status.totalRows > 0
      ? Math.round((status.processedRows / status.totalRows) * 100)
      : 0;

  // Validating state
  if (status.status === 'validating') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-blue-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Validating CSV...
        </h2>
        <p className="text-gray-600">
          Checking format and data integrity
        </p>
      </div>
    );
  }

  // Validation failed state
  if (status.status === 'validation_failed') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Validation Errors Found
        </h2>
        <p className="text-gray-600 mb-4">
          {status.validationErrors.length} issue(s) found in your CSV
        </p>

        <div className="mb-6 text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {status.validationErrors.slice(0, 10).map((error, i) => (
              <li key={i}>{error.message}</li>
            ))}
            {status.validationErrors.length > 10 && (
              <li className="text-yellow-600">
                ...and {status.validationErrors.length - 10} more
              </li>
            )}
          </ul>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="bg-gray-200 text-gray-800 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Fix and Re-upload
          </button>
          {onProceedAnyway && (
            <button
              onClick={onProceedAnyway}
              className="bg-yellow-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
            >
              Proceed Anyway
            </button>
          )}
        </div>
      </div>
    );
  }

  // Processing state
  if (status.status === 'processing') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-blue-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Processing CSV...
        </h2>
        <p className="text-gray-600 mb-4">
          Row {status.processedRows} of {status.totalRows}
        </p>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{progress}% complete</p>

        {status.processingErrors.length > 0 && (
          <div className="mt-4 text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-40 overflow-y-auto">
            <p className="text-yellow-700 font-medium text-sm mb-2">
              Warnings ({status.processingErrors.length})
            </p>
            <ul className="list-disc list-inside text-xs text-yellow-600">
              {status.processingErrors.slice(0, 10).map((error, i) => (
                <li key={i}>{error}</li>
              ))}
              {status.processingErrors.length > 10 && (
                <li>...and {status.processingErrors.length - 10} more</li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Complete state
  if (status.status === 'complete') {
    const successCount = status.processedRows - status.processingErrors.length;
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Import Complete!
        </h2>
        <p className="text-gray-600 mb-6">
          Successfully processed {successCount} of {status.processedRows} rows
        </p>

        {status.processingErrors.length > 0 && (
          <div className="mb-6 text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-yellow-700 font-medium text-sm mb-2">
              {status.processingErrors.length} row(s) had issues:
            </p>
            <ul className="list-disc list-inside text-xs text-yellow-600">
              {status.processingErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onReset}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Upload Another File
        </button>
      </div>
    );
  }

  // Error state
  if (status.status === 'error') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Import Failed</h2>

        <div className="mb-6 text-left bg-red-50 border border-red-200 rounded-lg p-4">
          <ul className="list-disc list-inside text-sm text-red-600">
            {status.processingErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={onReset}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return null;
}
