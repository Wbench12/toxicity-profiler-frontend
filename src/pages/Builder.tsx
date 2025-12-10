import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMoleculeStore } from "@/store/moleculeStore";
import { MoleculeEditor } from "@/components/MoleculeEditor";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ArrowRight } from "lucide-react";
import { Molecule3DModal } from "@/components/Molecule3DModal";

/**
 * Builder Page
 * Allows users to build molecules and proceed to analysis
 */
export const Builder: React.FC = () => {
  const navigate = useNavigate();
  const { smiles, error, setError, molFile } = useMoleculeStore();
  const [localError, setLocalError] = useState<string | null>(null);
  const [show3D, setShow3D] = useState(false);

  const handleAnalyze = () => {
    if (!smiles.trim()) {
      setLocalError("Please draw or input a molecule first");
      return;
    }
    navigate("/analysis");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Molecule Builder
          </h1>
          <p className="text-gray-600">
            Draw or input a molecule to begin toxicity analysis
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

        <div className="mb-8">
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShow3D(true)}
              className="rounded bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700 disabled:opacity-50"
              disabled={!molFile}
            >
              View 3D Molecule
            </button>
          </div>
          <MoleculeEditor />
        </div>

        <Molecule3DModal
          molfile2D={molFile}
          open={show3D}
          onOpenChange={setShow3D}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleAnalyze}
            disabled={!smiles.trim()}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Analyze Molecule
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
