import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMoleculeStore } from "@/store/moleculeStore";
import { fetchCompletePrediction, CompletePrediction, SimplifiedPrediction } from "@/api/qsar";
import { PredictionTable } from "@/components/PredictionTable";
import { RadarChart } from "@/components/RadarChart";
import { ToxicityBarChart } from "@/components/ToxicityBarChart";
import { Loading } from "@/components/Loading";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ArrowRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

/**
 * Analysis Page
 * Displays complete QSAR predictions with FDA approval, toxicity, and recommendation
 * Shows interactive visualizations and molecular properties
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
  } = useQuery<CompletePrediction>({
    queryKey: ["qsar-complete", smiles],
    queryFn: () => fetchCompletePrediction(smiles),
    enabled: !!smiles,
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      // Convert to legacy format for store compatibility
      setPredictions({
        smiles: data.smiles,
        model_used: "Random Forest Ensemble (3 models)",
        timestamp: new Date().toISOString(),
        predictions: [
          {
            endpoint: "FDA Approval",
            prediction: data.drug_approval.probabilities.drug_discovery?.prediction || 0,
            probability: data.drug_approval.probabilities.drug_discovery?.probabilities["1"] || 0,
            confidence: data.drug_approval.probabilities.drug_discovery?.confidence || 0,
          },
          {
            endpoint: "Clinical Toxicity",
            prediction: data.drug_approval.probabilities.ct_tox?.prediction || 0,
            probability: data.drug_approval.probabilities.ct_tox?.probabilities["1"] || 0,
            confidence: data.drug_approval.probabilities.ct_tox?.confidence || 0,
          },
          {
            endpoint: "General Toxicity",
            prediction: data.toxicity.prediction,
            probability: data.toxicity.probabilities["1"],
            confidence: data.toxicity.confidence,
          },
        ],
      });
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

  // Prepare data for visualizations - include all three models
  const predictions: SimplifiedPrediction[] = [
    {
      endpoint: "FDA Approval",
      prediction: data.drug_approval.probabilities.drug_discovery?.prediction || 0,
      probability: data.drug_approval.probabilities.drug_discovery?.probabilities["1"] || 0,
      confidence: data.drug_approval.probabilities.drug_discovery?.confidence || 0,
    },
    {
      endpoint: "Clinical Toxicity",
      prediction: data.drug_approval.probabilities.ct_tox?.prediction || 0,
      probability: data.drug_approval.probabilities.ct_tox?.probabilities["1"] || 0,
      confidence: data.drug_approval.probabilities.ct_tox?.confidence || 0,
    },
    {
      endpoint: "General Toxicity",
      prediction: data.toxicity.prediction,
      probability: data.toxicity.probabilities["1"],
      confidence: data.toxicity.confidence,
    },
  ];

  const radarData = predictions.map((pred) => ({
    endpoint: pred.endpoint,
    value: pred.prediction,
  }));

  // Get risk level color
  const getRiskColor = (risk: string) => {
    if (risk.includes("LOW")) return "text-green-700 bg-green-50 border-green-200";
    if (risk.includes("MODERATE")) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (risk.includes("HIGH")) return "text-red-700 bg-red-50 border-red-200";
    return "text-gray-700 bg-gray-50 border-gray-200";
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes("HIGHLY RECOMMENDED") || recommendation.includes("✅")) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    }
    if (recommendation.includes("CAUTION") || recommendation.includes("⚠️")) {
      return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
    }
    return <XCircle className="w-6 h-6 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Drug Discovery Analysis
          </h1>
          <p className="text-gray-600">
            Molecule:{" "}
            <span className="font-mono text-sm text-gray-700">{data.canonical_smiles}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Models: Drug Discovery + CT_TOX + TOX21
          </p>
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

        {/* Overall Recommendation Card */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              {getRecommendationIcon(data.recommendation)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Overall Assessment
              </h2>
              <p className="text-gray-700 mb-3">{data.recommendation}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Risk Level:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRiskColor(data.risk_level)}`}>
                  {data.risk_level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Predictions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* FDA Approval Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              FDA Approval
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Prediction:</span>
                <span className="font-semibold text-lg">
                  {data.drug_approval.probabilities.drug_discovery?.prediction === 1 ? "✅ Approved" : "❌ Not Approved"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-semibold">
                  {((data.drug_approval.probabilities.drug_discovery?.confidence || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Probabilities:</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Not Approved:</span>
                    <span>{((data.drug_approval.probabilities.drug_discovery?.probabilities["0"] || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Approved:</span>
                    <span>{((data.drug_approval.probabilities.drug_discovery?.probabilities["1"] || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 italic">
                  Drug Discovery Model
                </div>
              </div>
            </div>
          </div>

          {/* CT_TOX Clinical Toxicity Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Clinical Toxicity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Prediction:</span>
                <span className="font-semibold text-lg">
                  {data.drug_approval.probabilities.ct_tox?.prediction === 0 ? "🟢 Non-Toxic" : "🔴 Toxic"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-semibold">
                  {((data.drug_approval.probabilities.ct_tox?.confidence || 0) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Probabilities:</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Non-Toxic:</span>
                    <span>{((data.drug_approval.probabilities.ct_tox?.probabilities["0"] || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Toxic:</span>
                    <span>{((data.drug_approval.probabilities.ct_tox?.probabilities["1"] || 0) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 italic">
                  CT_TOX Model (Clinical)
                </div>
              </div>
            </div>
          </div>

          {/* TOX21 General Toxicity Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              General Toxicity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Prediction:</span>
                <span className="font-semibold text-lg">
                  {data.toxicity.prediction_label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-semibold">
                  {(data.toxicity.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">Probabilities:</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Non-Toxic:</span>
                    <span>{(data.toxicity.probabilities["0"] * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Toxic:</span>
                    <span>{(data.toxicity.probabilities["1"] * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 italic">
                  TOX21 Model (General)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/builder")}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Analyze Another
          </button>
        </div>
      </div>
    </div>
  );
};