import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMoleculeStore } from "@/store/moleculeStore";
import { fetchSimilarDrugs, SimilarityResponse } from "@/api/similarity";
import { SimilarityList } from "@/components/SimilarityList";
import { Loading } from "@/components/Loading";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ArrowLeft } from "lucide-react";

/**
 * Similarity Page
 * Displays similar drugs ranked by similarity score
 * Uses fingerprint-based similarity (Tanimoto, Jaccard)
 */
export const Similarity: React.FC = () => {
  const navigate = useNavigate();
  const { smiles, setSimilarityResults, setError, error } = useMoleculeStore();
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if no SMILES
  useEffect(() => {
    if (!smiles) {
      navigate("/builder");
    }
  }, [smiles, navigate]);

  // Fetch similar drugs using React Query
  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<SimilarityResponse>({
    queryKey: ["similarity", smiles],
    queryFn: () => fetchSimilarDrugs(smiles, 10),
    enabled: !!smiles,
    retry: 1,
  });

  useEffect(() => {
    if (data) {
      setSimilarityResults(data);
    }
  }, [data, setSimilarityResults]);

  useEffect(() => {
    if (isError && queryError) {
      setLocalError(
        (queryError as any).message || "Failed to fetch similar drugs"
      );
    }
  }, [isError, queryError]);

  if (isLoading) {
    return <Loading message="Finding similar drugs..." fullHeight />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Drug Similarity
          </h1>
          <p className="text-gray-600">
            Similar drugs to:{" "}
            <span className="font-mono text-sm text-gray-700">{smiles}</span>
          </p>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              Database: {data.model_used}
            </p>
          )}
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

        {/* Similarity List */}
        {data && (
          <div className="mb-8">
            <SimilarityList drugs={data.similar_drugs} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/analysis")}
            className="inline-flex items-center gap-2 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
