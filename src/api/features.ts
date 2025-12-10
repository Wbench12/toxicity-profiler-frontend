import client, { ApiError } from "./client";

/**
 * Interface for molecular features/descriptors response
 */
export interface MolecularFeatures {
  smiles: string;
  molecular_weight: number;
  logp: number;
  tpsa: number;
  h_donors: number;
  h_acceptors: number;
  rotatable_bonds: number;
  [key: string]: unknown;
}

/**
 * Fetch molecular descriptors from backend
 * @param smiles - SMILES string of the molecule
 * @returns Molecular features and descriptors
 */
export async function fetchMolecularFeatures(
  smiles: string
): Promise<MolecularFeatures> {
  try {
    const response = await client.post<MolecularFeatures>("/descriptors", {
      smiles,
    });
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Validate SMILES string via backend
 * @param smiles - SMILES string to validate
 * @returns True if valid, false otherwise
 */
export async function validateSmiles(smiles: string): Promise<boolean> {
  try {
    const response = await client.post<{ valid: boolean }>("/validate/smiles", {
      smiles,
    });
    return response.data.valid;
  } catch (error) {
    console.error("SMILES validation error:", error);
    return false;
  }
}
