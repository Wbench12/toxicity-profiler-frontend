import { create } from "zustand";
import { type QsarPrediction } from "@/api/qsar";

/**
 * Global molecule state interface
 */
export interface MoleculeState {
  smiles: string;
  molFile: string | null;
  predictions: QsarPrediction | null;
  similarityResults: unknown | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSmiles: (smiles: string) => void;
  setMolFile: (molFile: string) => void;
  setPredictions: (predictions: QsarPrediction | null) => void;
  setSimilarityResults: (results: unknown) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Zustand store for global molecule and prediction data
 * Persists SMILES, molecular structure, predictions, and analysis results
 */
export const useMoleculeStore = create<MoleculeState>((set) => ({
  smiles: "",
  molFile: null,
  predictions: null,
  similarityResults: null,
  loading: false,
  error: null,

  setSmiles: (smiles: string) => set({ smiles }),
  setMolFile: (molFile: string) => set({ molFile }),
  setPredictions: (predictions: QsarPrediction | null) => set({ predictions }),
  setSimilarityResults: (results: unknown) =>
    set({ similarityResults: results }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  reset: () =>
    set({
      smiles: "",
      molFile: null,
      predictions: null,
      similarityResults: null,
      loading: false,
      error: null,
    }),
}));
