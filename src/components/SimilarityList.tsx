import React from "react";
import { SimilarDrug } from "@/api/similarity";

/**
 * SimilarityList Component
 * Displays a ranked list of similar drugs with similarity scores
 * Shows top N similar compounds from database (ClinTox, etc.)
 */
interface SimilarityListProps {
  drugs: SimilarDrug[];
  loading?: boolean;
}

export const SimilarityList: React.FC<SimilarityListProps> = ({
  drugs,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Loading similar drugs...</p>
      </div>
    );
  }

  if (!drugs || drugs.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No similar drugs found</p>
      </div>
    );
  }

  // Sort by similarity score descending
  const sorted = [...drugs].sort(
    (a, b) => b.similarity_score - a.similarity_score
  );

  return (
    <div className="w-full space-y-3">
      {sorted.map((drug, idx) => (
        <div
          key={idx}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">{drug.name}</h4>
              <p className="text-xs text-gray-500">Dataset: {drug.dataset}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">
                {(drug.similarity_score * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">Similarity</p>
            </div>
          </div>

          {/* Similarity Score Bar */}
          <div className="bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-300"
              style={{ width: `${drug.similarity_score * 100}%` }}
            />
          </div>

          {/* Score Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-gray-600">
              <span className="font-medium">Tanimoto:</span>{" "}
              {(drug.tanimoto_coefficient * 100).toFixed(2)}%
            </div>
            <div className="text-gray-600">
              <span className="font-medium">SMILES:</span>{" "}
              <span className="font-mono truncate">{drug.smiles}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
