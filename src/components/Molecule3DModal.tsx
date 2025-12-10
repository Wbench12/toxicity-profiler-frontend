import React from "react";
import { Molecule3DViewer } from "@/components/Molecule3DViewer";

interface Molecule3DModalProps {
  molfile2D: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Molecule3DModal: React.FC<Molecule3DModalProps> = ({
  molfile2D,
  open,
  onOpenChange,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              3D Molecule Preview
            </h2>
            <p className="text-sm text-gray-600">
              Uses RDKit.js + 3Dmol.js to generate HyperChem-style
              ball-and-stick coordinates.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
        <div className="h-[480px] w-full rounded-lg border border-gray-200 bg-gray-50">
          {molfile2D ? (
            <Molecule3DViewer molfile2D={molfile2D} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Draw a molecule, then click "Sync 3D Viewer" to generate the
              preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
