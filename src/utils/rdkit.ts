export interface RDKitMolecule {
  get_smiles?: () => string;
  get_molblock?: () => string;
  delete?: () => void;
}

export interface RDKitModule {
  get_mol: (input: string) => RDKitMolecule | null;
}

declare global {
  interface Window {
    initRDKitModule?: (
      config?: Record<string, unknown>
    ) => Promise<RDKitModule>;
  }
}

const BASE_URL = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const RDKIT_BASE_URL = `${BASE_URL}/vendor/rdkit/`;
const RDKIT_SCRIPT_SRCS = [`${RDKIT_BASE_URL}RDKit_minimal.js`];

let rdkitModulePromise: Promise<RDKitModule> | null = null;

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Document is not available"));
      return;
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });

const loadScriptWithFallbacks = async (sources: string[]) => {
  let lastError: Error | null = null;
  for (const src of sources) {
    try {
      await loadScript(src);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error("Failed to load script from all sources");
};

export const loadRdkitModule = async (): Promise<RDKitModule> => {
  if (!rdkitModulePromise) {
    rdkitModulePromise = loadScriptWithFallbacks(RDKIT_SCRIPT_SRCS)
      .then(() => {
        if (typeof window === "undefined" || !window.initRDKitModule) {
          throw new Error("RDKit loader missing after script load");
        }
        return window
          .initRDKitModule({
            locateFile: (file: string) => `${RDKIT_BASE_URL}${file}`,
          })
          .then((module: RDKitModule) => {
            (window as any).RDKit = module;
            return module;
          });
      })
      .catch((error) => {
        rdkitModulePromise = null;
        throw error;
      });
  }
  return rdkitModulePromise;
};

export const resetRdkitLoaderForTests = () => {
  rdkitModulePromise = null;
};
