import client, { ApiError } from "./client";

/**
 * Interface for toxicity prediction endpoints
 */
export interface ToxicityPrediction {
  endpoint: string;
  prediction: number;
  probability: number;
  confidence: number;
}

/**
 * Interface for full QSAR prediction response
 */
export interface QsarPrediction {
  smiles: string;
  predictions: ToxicityPrediction[];
  model_used: string;
  timestamp: string;
}

/**
 * Fetch toxicity predictions from backend
 * Uses classical ML models (Random Forest, SVM, XGBoost, LightGBM, KNN, Logistic Regression)
 * @param smiles - SMILES string of the molecule
 * @returns Toxicity predictions for various endpoints
 */
export async function fetchQsarPredictions(
  smiles: string
): Promise<QsarPrediction> {
  try {
    const response = await client.post<QsarPrediction>("/predict/qsar", {
      smiles,
    });
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Fetch toxicity prediction for a specific endpoint
 * @param smiles - SMILES string
 * @param endpoint - Toxicity endpoint (e.g., 'LD50', 'hERG')
 * @returns Single endpoint prediction
 */
export async function fetchEndpointPrediction(
  smiles: string,
  endpoint: string
): Promise<ToxicityPrediction> {
  try {
    const response = await client.post<ToxicityPrediction>(
      "/predict/endpoint",
      {
        smiles,
        endpoint,
      }
    );
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}
