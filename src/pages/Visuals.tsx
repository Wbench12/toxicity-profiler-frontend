import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMoleculeStore } from "@/store/moleculeStore";
import { ToxicityBarChart } from "@/components/ToxicityBarChart";
import { RadarChart } from "@/components/RadarChart";
import { ArrowLeft, Download } from "lucide-react";

/**
 * Visuals Page
 * Displays multiple chart types for toxicity analysis
 * Allows users to explore predictions in different visual formats
 */
export const Visuals: React.FC = () => {
  const navigate = useNavigate();
  const { predictions } = useMoleculeStore();
  const [selectedChart, setSelectedChart] = useState<
    "radar" | "bar" | "comparison"
  >("radar");
  const predictionsList = predictions?.predictions || [];

  useEffect(() => {
    if (!predictions) {
      navigate("/builder");
    }
  }, [predictions, navigate]);

  const handleExportChart = () => {
    // Export chart data as CSV
    if (!predictionsList || predictionsList.length === 0) return;
    const csv = [
      ["Endpoint", "Prediction", "Confidence", "Risk Level"],
      ...predictionsList.map((p) => [
        p.endpoint,
        p.prediction.toFixed(2),
        p.confidence.toFixed(2),
        p.confidence > 0.8 ? "High" : p.confidence > 0.6 ? "Medium" : "Low",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "toxicity_predictions.csv";
    a.click();
  };

  // Transform data for chart components
  const radarChartData = predictionsList.map((p) => ({
    endpoint: p.endpoint,
    value: p.prediction,
  }));

  const barChartData = predictionsList.map((p) => ({
    endpoint: p.endpoint,
    prediction: p.prediction,
  }));

  if (!predictions) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Visualization Dashboard
          </h1>
          <p className="text-gray-600">
            Explore toxicity predictions with interactive charts
          </p>
        </div>

        {/* Chart Type Selector */}
        <div className="mb-8 flex gap-4 flex-wrap">
          {(["radar", "bar", "comparison"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedChart(type)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedChart === type
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {type === "radar" && "Radar Chart"}
              {type === "bar" && "Bar Chart"}
              {type === "comparison" && "Comparison"}
            </button>
          ))}
        </div>

        {/* Chart Container */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {selectedChart === "radar" && <RadarChart data={radarChartData} />}
          {selectedChart === "bar" && <ToxicityBarChart data={barChartData} />}
          {selectedChart === "comparison" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Radar View
                </h3>
                <RadarChart data={radarChartData} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Bar View
                </h3>
                <ToxicityBarChart data={barChartData} />
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Average Confidence</p>
            <p className="text-3xl font-bold text-blue-600">
              {(
                predictionsList.reduce(
                  (sum: number, p) => sum + p.confidence,
                  0
                ) / predictionsList.length
              ).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Endpoints</p>
            <p className="text-3xl font-bold text-green-600">
              {predictionsList.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">High Risk Endpoints</p>
            <p className="text-3xl font-bold text-red-600">
              {predictionsList.filter((p) => p.prediction > 0.7).length}
            </p>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={handleExportChart}
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            <Download className="w-4 h-4" />
            Export as CSV
          </button>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/analysis")}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
};
