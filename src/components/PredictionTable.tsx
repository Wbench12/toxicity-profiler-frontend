import React from "react";
import { ToxicityPrediction } from "@/api/qsar";

/**
 * PredictionTable Component
 * Displays QSAR predictions as a sortable, filterable table
 * Shows toxicity endpoints with predictions and confidence scores
 */
interface PredictionTableProps {
  predictions: ToxicityPrediction[];
  loading?: boolean;
}

export const PredictionTable: React.FC<PredictionTableProps> = ({
  predictions,
  loading = false,
}) => {
  const [sortField, setSortField] =
    React.useState<keyof ToxicityPrediction>("prediction");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const sorted = React.useMemo(() => {
    return [...predictions].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
  }, [predictions, sortField, sortOrder]);

  const getToxicityColor = (prediction: number) => {
    if (prediction > 0.7) return "bg-red-50 border-red-200";
    if (prediction > 0.4) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getToxicityBadge = (prediction: number) => {
    if (prediction > 0.7)
      return (
        <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-bold">
          HIGH
        </span>
      );
    if (prediction > 0.4)
      return (
        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-bold">
          MEDIUM
        </span>
      );
    return (
      <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs font-bold">
        LOW
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Loading predictions...</p>
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No predictions available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b border-gray-200">
          <tr>
            <th
              className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
              onClick={() => {
                setSortField("endpoint");
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              }}
            >
              Endpoint
            </th>
            <th
              className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
              onClick={() => {
                setSortField("prediction");
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              }}
            >
              Prediction
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Probability
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Confidence
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
              Risk Level
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((pred, idx) => (
            <tr
              key={idx}
              className={`border-b border-gray-200 ${getToxicityColor(
                pred.prediction
              )}`}
            >
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {pred.endpoint}
              </td>
              <td className="px-6 py-4 text-sm font-mono text-gray-700">
                {(pred.prediction * 100).toFixed(2)}%
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {(pred.probability * 100).toFixed(2)}%
              </td>
              <td className="px-6 py-4 text-sm text-gray-700">
                {(pred.confidence * 100).toFixed(1)}%
              </td>
              <td className="px-6 py-4 text-sm">
                {getToxicityBadge(pred.prediction)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
