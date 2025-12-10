import client, { ApiError } from "./client";

/**
 * Interface for a similar drug in the database
 */
export interface SimilarDrug {
  name: string;
  smiles: string;
  similarity_score: number;
  tanimoto_coefficient: number;
  dataset: string;
}

/**
 * Interface for drug similarity response
 */
export interface SimilarityResponse {
  query_smiles: string;
  similar_drugs: SimilarDrug[];
  model_used: string;
}

/**
 * Fetch drugs similar to a query molecule
 * Uses fingerprint-based similarity (Tanimoto, Jaccard)
 * @param smiles - SMILES string of the query molecule
 * @param top_n - Number of top similar drugs to return (default: 5)
 * @returns List of similar drugs with similarity scores
 */
export async function fetchSimilarDrugs(
  smiles: string,
  top_n: number = 5
): Promise<SimilarityResponse> {
  try {
    const response = await client.post<SimilarityResponse>(
      "/similarity/drugs",
      {
        smiles,
        top_n,
      }
    );
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Fetch ClinTox dataset information
 * @returns List of known drugs from ClinTox dataset
 */
export async function fetchClinToxDataset(): Promise<SimilarDrug[]> {
  try {
    const response = await client.get<SimilarDrug[]>("/datasets/clintox");
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}
