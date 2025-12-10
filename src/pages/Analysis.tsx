import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMoleculeStore } from "@/store/moleculeStore";
import { fetchQsarPredictions, QsarPrediction } from "@/api/qsar";
import { PredictionTable } from "@/components/PredictionTable";
import { RadarChart } from "@/components/RadarChart";
import { ToxicityBarChart } from "@/components/ToxicityBarChart";
import { Loading } from "@/components/Loading";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ArrowRight } from "lucide-react";

/**
 * Analysis Page
 * Displays QSAR predictions with interactive visualizations
 * Shows toxicity endpoints as table, radar chart, and bar chart
 */
export const Analysis: React.FC = () => {
  const navigate = useNavigate();
  const { smiles, setPredictions, setError, error } = useMoleculeStore();
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if no SMILES
  useEffect(() => {
    if (!smiles) {
      navigate("/builder");
    }
  }, [smiles, navigate]);

  // Fetch predictions using React Query
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<QsarPrediction>({
    queryKey: ["qsar", smiles],
    queryFn: () => fetchQsarPredictions(smiles),
    enabled: !!smiles,
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      setPredictions(data);
    }
  }, [data, setPredictions]);

  useEffect(() => {
    if (isError && queryError) {
      setLocalError(
        (queryError as any).message || "Failed to fetch predictions"
      );
    }
  }, [isError, queryError]);

  if (isLoading) {
    return <Loading message="Analyzing molecule..." fullHeight />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const radarData = data.predictions.map((pred) => ({
    endpoint: pred.endpoint,
    value: pred.prediction,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Toxicity Analysis
          </h1>
          <p className="text-gray-600">
            Molecule:{" "}
            <span className="font-mono text-sm text-gray-700">{smiles}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">Model: {data.model_used}</p>
        </div>

        {/* Error Display */}
        {(error || localError) && (
          <div className="mb-6">
            <ErrorAlert
              error={error || localError}
              onDismiss={() => {
                setError(null);
                setLocalError(null);
              }}
            />
          </div>
        )}

        {/* Prediction Table */}
        <div className="mb-8">
          <PredictionTable predictions={data.predictions} />
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RadarChart data={radarData} />
          <ToxicityBarChart
            data={data.predictions.map((p) => ({
              endpoint: p.endpoint,
              prediction: p.prediction,
            }))}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/builder")}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Analyze Another
          </button>
          <button
            onClick={() => navigate("/similarity")}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Compare with Drugs
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
