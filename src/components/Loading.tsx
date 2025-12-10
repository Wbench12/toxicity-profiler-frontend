import React from "react";

/**
 * Loading Component
 * Displays a centered loading spinner with optional message
 */
interface LoadingProps {
  message?: string;
  fullHeight?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = "Loading...",
  fullHeight = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullHeight ? "h-screen" : "py-12"
      }`}
    >
      {/* Spinner */}
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
      </div>

      {/* Message */}
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
};
