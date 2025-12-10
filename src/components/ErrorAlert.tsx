import React from "react";
import { AlertCircle, X } from "lucide-react";

/**
 * ErrorAlert Component
 * Displays API errors or validation errors with optional dismiss button
 */
interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  title?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  title = "Error",
}) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-semibold text-red-900">{title}</h3>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-900 transition"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
