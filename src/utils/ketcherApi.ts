import type { Ketcher } from "ketcher-core";

export interface KetcherApi {
  renderFromCtab: (molfile: string) => Promise<void>;
  clearSelection: () => void;
  selectAll: () => void;
  selectAtomsById: (ids: number[]) => void;
  exportCtab: () => Promise<string>;
  getSelectedAtomId: () => string | null;
  highlightSelection: (
    color: string
  ) => { lastHighlightID: number | null; lastHighlight: unknown } | null;
  clearHighlights: () => void;
  getAllHighlights: () => unknown;
}

const getEditor = (ketcher: Ketcher) =>
  (ketcher as unknown as { editor: any }).editor;

export const createKetcherApi = (ketcher: Ketcher): KetcherApi => {
  const editor = getEditor(ketcher);

  return {
    renderFromCtab: (molfile: string) => ketcher.setMolecule(molfile),
    clearSelection: () => editor.selection(null),
    selectAll: () => editor.selection("all"),
    selectAtomsById: (ids: number[]) => editor.selection({ atoms: ids }),
    exportCtab: () => ketcher.getMolfile(),
    getSelectedAtomId: () => {
      const selection = editor.selection();
      if (!selection?.atoms?.length) {
        return null;
      }
      return selection.atoms.join(", ");
    },
    highlightSelection: (color: string) => {
      const selection = editor.selection() || {};
      const { atoms, bonds } = selection;
      if (!atoms?.length && !bonds?.length) {
        return null;
      }

      editor.highlights.create({ atoms, bonds, color });
      const highlights = editor.render.ctab.molecule.highlights;
      const keys = Array.from(highlights.keys());
      const lastHighlightID = keys.length
        ? (keys[keys.length - 1] as number)
        : null;
      const lastHighlight = lastHighlightID
        ? highlights.get(lastHighlightID)
        : null;
      return { lastHighlightID, lastHighlight };
    },
    clearHighlights: () => editor.highlights.clear(),
    getAllHighlights: () => editor.highlights.getAll(),
  };
};
