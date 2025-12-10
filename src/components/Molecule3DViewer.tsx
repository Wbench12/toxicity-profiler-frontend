import React, { useEffect, useRef, useState } from "react";
import { loadRdkitModule } from "@/utils/rdkit";

interface Molecule3DViewerProps {
  molfile2D: string;
}

declare global {
  interface Window {
    $3Dmol?: any;
  }
}

const MOL3D_SCRIPT_SRCS = [
  "https://3dmol.org/build/3Dmol-min.js",
  "https://cdn.jsdelivr.net/npm/3dmol@latest/build/3Dmol-min.js",
];

const ensureSdfPayload = (rawMolblock: string): string => {
  if (!rawMolblock) {
    return "";
  }

  const hasContent = rawMolblock.trim().length > 0;
  if (!hasContent) {
    return "";
  }

  const trimmedEnd = rawMolblock.replace(/\s+$/g, "");
  if (/\$\$\$\$$/m.test(trimmedEnd.split(/\r?\n/).pop() ?? "")) {
    return trimmedEnd;
  }

  return `${trimmedEnd}\n$$$$`;
};

let mol3DScriptPromise: Promise<typeof window.$3Dmol> | null = null;

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
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

const load3DMol = () => {
  if (!mol3DScriptPromise) {
    mol3DScriptPromise = loadScriptWithFallbacks(MOL3D_SCRIPT_SRCS)
      .then(() => {
        if (!window.$3Dmol) {
          throw new Error("3Dmol.js failed to expose $3Dmol");
        }
        return window.$3Dmol;
      })
      .catch((error) => {
        mol3DScriptPromise = null;
        throw error;
      });
  }
  return mol3DScriptPromise;
};

export const Molecule3DViewer: React.FC<Molecule3DViewerProps> = ({
  molfile2D,
}) => {
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [status, setStatus] = useState<string>("Loading 3D viewer...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const generateAndRender = async () => {
      if (!molfile2D.trim()) {
        setError("No structure provided");
        setStatus("Waiting for structure");
        return;
      }

      setError(null);
      setStatus("Preparing SMILES for 3D builder...");

      try {
        const [RDKit, $3Dmol] = await Promise.all([
          loadRdkitModule(),
          load3DMol(),
        ]);
        if (cancelled || !viewerContainerRef.current) {
          return;
        }

        const mol = RDKit.get_mol(molfile2D);
        if (!mol) {
          throw new Error("RDKit could not parse the molfile");
        }

        let smiles = "";
        let molblock = "";

        try {
          smiles = mol.get_smiles?.()?.trim() ?? "";
          molblock = ensureSdfPayload(mol.get_molblock?.() ?? "");
        } finally {
          mol.delete?.();
        }

        if (!molblock && smiles) {
          const smilesMol = RDKit.get_mol(smiles);
          try {
            molblock =
              ensureSdfPayload(smilesMol?.get_molblock?.() ?? "") || "";
          } finally {
            smilesMol?.delete?.();
          }
        }

        const renderablePayloads: Array<{
          data: string;
          format: "sdf";
        }> = [];

        const sdfPayload = ensureSdfPayload(molblock);
        if (sdfPayload) {
          renderablePayloads.push({ data: sdfPayload, format: "sdf" });
        }

        if (!renderablePayloads.length) {
          throw new Error("RDKit did not return a valid mol block");
        }

        if (!viewerRef.current) {
          viewerRef.current = new $3Dmol.GLViewer(viewerContainerRef.current, {
            backgroundColor: "white",
          });
        }

        const viewer = viewerRef.current;
        viewer.clear();

        let model: any = null;
        let lastModelError: Error | null = null;

        for (const payload of renderablePayloads) {
          try {
            model = viewer.addModel(payload.data, payload.format);
            if (!model) {
              throw new Error("3Dmol.js returned an empty model");
            }
            break;
          } catch (candidateError) {
            lastModelError =
              candidateError instanceof Error
                ? candidateError
                : new Error(String(candidateError));
            viewer.removeAllModels?.();
            model = null;
          }
        }

        if (!model) {
          const tried = renderablePayloads
            .map((payload) => payload.format)
            .join(", ");
          const suffix = lastModelError ? ` (${lastModelError.message})` : "";
          throw new Error(
            `3Dmol.js could not build a model from formats: ${tried}${suffix}`
          );
        }
        if (typeof model?.addHydrogens === "function") {
          model.addHydrogens();
        }
        if (typeof model?.setStyle === "function") {
          model.setStyle(
            {},
            { sphere: { scale: 0.28 }, stick: { radius: 0.14 } }
          );
        } else {
          viewer.setStyle(
            {},
            {
              sphere: { scale: 0.28 },
              stick: { radius: 0.14 },
            }
          );
        }
        viewer.zoomTo();
        viewer.render();
        viewer.resize?.();
        setStatus("Rendered 3D molecule");
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Unknown error";
        if (message.includes("RDKit")) {
          setError(
            `${message}. Verify that the local assets exist under /vendor/rdkit/ and that Vite is serving them (rerun npm run dev if needed).`
          );
        } else if (message.includes("3Dmol")) {
          setError(
            `${message}. Verify https://3dmol.org or https://cdn.jsdelivr.net are accessible from this machine.`
          );
        } else {
          setError(message);
        }
        setStatus("Failed to render structure");
      }
    };

    generateAndRender();

    return () => {
      cancelled = true;
    };
  }, [molfile2D]);

  return (
    <div className="relative h-full w-full">
      <div ref={viewerContainerRef} className="h-full w-full" />
      {error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/80 text-center text-sm font-semibold text-red-600">
          {error}
        </div>
      )}
      {!error && (
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-xs text-gray-700">
          {status}
        </div>
      )}
    </div>
  );
};
