// Update your PredictionTable.tsx props interface to this:

import React from "react";

export interface PredictionData {
  endpoint: string;
  prediction: number;
  probability: number;
  confidence: number;
}

export interface PredictionTableProps {
  predictions: PredictionData[];
}

export const PredictionTable: React.FC<PredictionTableProps> = ({ predictions }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Endpoint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prediction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {predictions.map((pred, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pred.endpoint}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      pred.prediction === 1
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {pred.prediction === 1 ? "Positive" : "Negative"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {(pred.probability * 100).toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {(pred.confidence * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};