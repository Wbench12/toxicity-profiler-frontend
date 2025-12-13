import client, { ApiError } from "./client";

/**
 * Molecular Properties from backend
 */
export interface MolecularProperties {
  canonical_smiles: string;
  molecular_weight: number;
  logp: number;
  num_h_donors: number;
  num_h_acceptors: number;
  num_rotatable_bonds: number;
  tpsa: number;
  num_aromatic_rings: number;
}

/**
 * Drug Approval Prediction (combines drug_discovery + ct_tox models)
 */
export interface DrugPrediction {
  prediction: number; // 0 = Not Approved, 1 = Approved
  prediction_label: string;
  confidence: number;
  probabilities: {
    not_approved: number;
    approved: number;
    drug_discovery?: {
      not_approved: number;
      approved: number;
    };
    ct_tox?: {
      non_toxic: number;
      toxic: number;
    };
  };
}

/**
 * Toxicity Prediction (TOX21 model)
 */
export interface ToxicityPrediction {
  prediction: number; // 0 = Non-Toxic, 1 = Toxic
  prediction_label: string;
  confidence: number;
  probabilities: {
    non_toxic: number;
    toxic: number;
  };
}

/**
 * Complete Prediction Response
 */
export interface CompletePrediction {
  smiles: string;
  canonical_smiles: string;
  molecular_properties: MolecularProperties | null;
  drug_approval: DrugPrediction;
  toxicity: ToxicityPrediction;
  recommendation: string;
  risk_level: string;
}

/**
 * Drug-only Prediction Response
 */
export interface DrugPredictionResponse {
  smiles: string;
  canonical_smiles: string;
  molecular_properties: MolecularProperties | null;
  prediction: DrugPrediction;
}

/**
 * Toxicity-only Prediction Response
 */
export interface ToxicityPredictionResponse {
  smiles: string;
  canonical_smiles: string;
  molecular_properties: MolecularProperties | null;
  prediction: ToxicityPrediction;
}

/**
 * Legacy interface for backward compatibility with existing Analysis component
 * Maps the new API response to the old format
 */
export interface QsarPrediction {
  smiles: string;
  predictions: Array<{
    endpoint: string;
    prediction: number;
    probability: number;
    confidence: number;
  }>;
  model_used: string;
  timestamp: string;
}

/**
 * Simplified prediction for display in tables/charts
 */
export interface SimplifiedPrediction {
  endpoint: string;
  prediction: number;
  probability: number;
  confidence: number;
}

/**
 * Batch Response Types
 */
export interface BatchDrugResponse {
  total: number;
  successful: number;
  failed: number;
  predictions: DrugPredictionResponse[];
  errors: Array<{ index: number; smiles: string; error: string }>;
}

export interface BatchToxicityResponse {
  total: number;
  successful: number;
  failed: number;
  predictions: ToxicityPredictionResponse[];
  errors: Array<{ index: number; smiles: string; error: string }>;
}

export interface ModelsInfo {
  drug_discovery_model: {
    name: string;
    type: string;
    features: number;
    loaded: boolean;
  };
  ct_tox_model: {
    name: string;
    type: string;
    features: number;
    loaded: boolean;
  };
  toxicity_model: {
    name: string;
    type: string;
    features: number;
    loaded: boolean;
  };
  rdkit_available: boolean;
  features_count: number;
}

/**
 * Fetch complete prediction (FDA approval + toxicity)
 * This is the recommended endpoint for full analysis
 * @param smiles - SMILES string of the molecule
 * @returns Complete prediction with recommendation
 */
export async function fetchCompletePrediction(
  smiles: string
): Promise<CompletePrediction> {
  try {
    const response = await client.post<CompletePrediction>("/qsar/predict", {
      smiles,
    });
    return response.data;
  } catch (error) {
    console.error("Complete prediction error:", error);
    throw error as ApiError;
  }
}

/**
 * Fetch drug approval prediction only
 * Uses both drug_discovery and ct_tox models
 * @param smiles - SMILES string of the molecule
 * @returns Drug approval prediction
 */
export async function fetchDrugPrediction(
  smiles: string
): Promise<DrugPredictionResponse> {
  try {
    const response = await client.post<DrugPredictionResponse>(
      "/qsar/drug-predict",
      { smiles }
    );
    return response.data;
  } catch (error) {
    console.error("Drug prediction error:", error);
    throw error as ApiError;
  }
}

/**
 * Fetch toxicity prediction only
 * Uses TOX21 model
 * @param smiles - SMILES string of the molecule
 * @returns Toxicity prediction
 */
export async function fetchToxicityPrediction(
  smiles: string
): Promise<ToxicityPredictionResponse> {
  try {
    const response = await client.post<ToxicityPredictionResponse>(
      "/qsar/toxicity-predict",
      { smiles }
    );
    return response.data;
  } catch (error) {
    console.error("Toxicity prediction error:", error);
    throw error as ApiError;
  }
}

/**
 * Legacy function for backward compatibility
 * Converts the new API format to the old format expected by Analysis component
 * @param smiles - SMILES string of the molecule
 * @returns Toxicity predictions in legacy format
 */
export async function fetchQsarPredictions(
  smiles: string
): Promise<QsarPrediction> {
  try {
    const response = await fetchCompletePrediction(smiles);
    
    // Convert to legacy format
    return {
      smiles: response.smiles,
      model_used: "Random Forest Ensemble (drug_discovery + ct_tox + tox21)",
      timestamp: new Date().toISOString(),
      predictions: [
        {
          endpoint: "FDA Approval",
          prediction: response.drug_approval.prediction,
          probability: response.drug_approval.probabilities.approved,
          confidence: response.drug_approval.confidence,
        },
        {
          endpoint: "Clinical Toxicity",
          prediction: response.toxicity.prediction,
          probability: response.toxicity.probabilities.toxic,
          confidence: response.toxicity.confidence,
        },
      ],
    };
  } catch (error) {
    console.error("QSAR predictions error:", error);
    throw error as ApiError;
  }
}

/**
 * Batch drug prediction
 * @param smilesArray - Array of SMILES strings (max 100)
 */
export async function fetchDrugPredictionBatch(
  smilesArray: string[]
): Promise<BatchDrugResponse> {
  try {
    const response = await client.post<BatchDrugResponse>(
      "/qsar/drug-predict-batch",
      {
        molecules: smilesArray.map(smiles => ({ smiles })),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Batch drug prediction error:", error);
    throw error as ApiError;
  }
}

/**
 * Batch toxicity prediction
 * @param smilesArray - Array of SMILES strings (max 100)
 */
export async function fetchToxicityPredictionBatch(
  smilesArray: string[]
): Promise<BatchToxicityResponse> {
  try {
    const response = await client.post<BatchToxicityResponse>(
      "/qsar/toxicity-predict-batch",
      {
        molecules: smilesArray.map(smiles => ({ smiles })),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Batch toxicity prediction error:", error);
    throw error as ApiError;
  }
}

/**
 * Get models information
 */
export async function fetchModelsInfo(): Promise<ModelsInfo> {
  try {
    const response = await client.get<ModelsInfo>("/qsar/models-info");
    return response.data;
  } catch (error) {
    console.error("Models info error:", error);
    throw error as ApiError;
  }
}