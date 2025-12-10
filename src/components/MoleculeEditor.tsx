import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useMoleculeStore } from "@/store/moleculeStore";
import { Copy, Download, Zap } from "lucide-react";
import { Editor, type ButtonsConfig } from "ketcher-react";
import "ketcher-react/dist/index.css";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import {
  RemoteStructServiceProvider,
  type Ketcher,
  type StructServiceProvider,
} from "ketcher-core";
import {
  allToolbarButtons,
  initiallyHiddenButtons,
  toolbarButtonLabels,
  type ToolbarButtonKey,
} from "@/constants/ketcherButtons";
import { createKetcherApi, type KetcherApi } from "@/utils/ketcherApi";
import { loadRdkitModule } from "@/utils/rdkit";

const ControlCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
    <p className="text-sm font-semibold text-gray-700">{title}</p>
    <div className="mt-3 space-y-3 text-sm text-gray-700">{children}</div>
  </div>
);

/**
 * MoleculeEditor Component
 * Provides embedded Ketcher editor for drawing molecules and SMILES text input
 * Allows users to build molecules and export SMILES or MOL file
 */
export const MoleculeEditor: React.FC = () => {
  const [inputMode, setInputMode] = useState<"draw" | "smiles">("draw");
  const [smilesInput, setSmilesInput] = useState("");
  const [ketcherInstance, setKetcherInstance] = useState<Ketcher | null>(null);
  const [ketcherApi, setKetcherApi] = useState<KetcherApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState("");
  const [highlightColor, setHighlightColor] = useState("#FF7F50");
  const [selectInput, setSelectInput] = useState("");
  const [selectInputError, setSelectInputError] = useState(false);
  const [hiddenButtons, setHiddenButtons] = useState<ToolbarButtonKey[]>(
    initiallyHiddenButtons
  );
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const structServiceProviderRef = useRef<StructServiceProvider | null>(null);
  const indigoServiceUrl = useMemo(() => {
    const raw = import.meta.env.VITE_INDIGO_BASE_URL ?? "";
    return raw.trim();
  }, []);
  const usingRemoteStructService = Boolean(indigoServiceUrl);
  const { smiles, setSmiles, setMolFile } = useMoleculeStore();
  const staticResourcesUrl = useMemo(
    () => `${import.meta.env.BASE_URL.replace(/\/$/, "")}/ketcher`,
    []
  );

  const buttonsConfig = useMemo<ButtonsConfig>(() => {
    const config: ButtonsConfig = {};
    hiddenButtons.forEach((button) => {
      (config as Record<string, { hidden: boolean }>)[button] = {
        hidden: true,
      };
    });
    return config;
  }, [hiddenButtons]);

  const editorKey = useMemo(
    () => `ketcher-editor-${hiddenButtons.join("-") || "default"}`,
    [hiddenButtons]
  );

  const selectionRegex = /^\d+(,\d+)*$/;

  if (!structServiceProviderRef.current) {
    structServiceProviderRef.current = usingRemoteStructService
      ? (new RemoteStructServiceProvider(
          indigoServiceUrl
        ) as StructServiceProvider)
      : (new StandaloneStructServiceProvider() as unknown as StructServiceProvider);
  }

  const appendToTerminal = useCallback((message: string) => {
    setTerminalOutput((prev) => (prev ? `${prev}\n${message}` : message));
  }, []);

  const syncMolFile = useCallback(
    async (logMessage?: string) => {
      if (!ketcherApi) {
        return;
      }
      try {
        const molData = await ketcherApi.exportCtab();
        setMolFile(molData);
        if (logMessage) {
          appendToTerminal(logMessage);
        }
      } catch (error) {
        console.error("Error syncing MOL file:", error);
        appendToTerminal("Failed to sync MOL file for 3D viewer");
      }
    },
    [appendToTerminal, ketcherApi, setMolFile]
  );

  const handleGetSmiles = async () => {
    if (!ketcherInstance) return;
    try {
      const smilesFromEditor = await ketcherInstance.getSmiles();
      setSmiles(smilesFromEditor);
      appendToTerminal(`SMILES: ${smilesFromEditor}`);
    } catch (error) {
      console.error("Error getting SMILES from Ketcher:", error);
    }
  };

  const handleSmilesInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setSmilesInput(e.target.value);
  };

  const handleApplySmiles = async () => {
    const trimmed = smilesInput.trim();
    if (!trimmed) return;

    const tryApplyWithKetcher = async (): Promise<boolean> => {
      if (!ketcherInstance) {
        return false;
      }
      try {
        await ketcherInstance.setMolecule(trimmed);
        const canonical = await ketcherInstance.getSmiles();
        setSmiles(canonical);
        appendToTerminal("SMILES applied to editor");
        await syncMolFile("Synced SMILES to 3D viewer");
        return true;
      } catch (error) {
        console.error("Ketcher failed to apply SMILES:", error);
        appendToTerminal(
          `Ketcher could not load SMILES directly${
            error instanceof Error ? `: ${error.message}` : ""
          }`
        );
        return false;
      }
    };

    const tryApplyWithRdkit = async (): Promise<boolean> => {
      const RDKit = await loadRdkitModule();
      const mol = RDKit.get_mol(trimmed);
      if (!mol) {
        throw new Error("RDKit could not parse the SMILES string");
      }
      try {
        const canonical = mol.get_smiles?.()?.trim() || trimmed;
        const molblock = mol.get_molblock?.();
        if (!molblock || !molblock.trim()) {
          throw new Error("RDKit returned an empty MOL block");
        }
        setSmiles(canonical);
        setMolFile(molblock);
        appendToTerminal("SMILES stored via RDKit fallback");
        if (ketcherApi) {
          try {
            await ketcherApi.renderFromCtab(molblock);
            appendToTerminal("Rendered RDKit MOL into editor");
          } catch (renderError) {
            console.error("Error injecting RDKit MOL into Ketcher:", renderError);
            appendToTerminal(
              "Failed to display RDKit MOL inside Ketcher; 3D preview will still use it"
            );
          }
        }
        await syncMolFile("Synced RDKit MOL to 3D viewer");
        return true;
      } finally {
        mol.delete?.();
      }
    };

    try {
      const applied = (await tryApplyWithKetcher()) || (await tryApplyWithRdkit());
      if (applied) {
        setSmilesInput("");
        setInputMode("draw");
      }
    } catch (error) {
      console.error("Error applying SMILES:", error);
      appendToTerminal(
        `Failed to apply SMILES: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const handleExportMol = async () => {
    await syncMolFile("Exported MOL content to predictions store & 3D viewer");
  };

  const loadExampleMolecule = async (exampleSmiles: string) => {
    if (!ketcherInstance) return;
    try {
      await ketcherInstance.setMolecule(exampleSmiles);
      const synced = await ketcherInstance.getSmiles();
      setSmiles(synced);
      appendToTerminal(`Loaded example: ${synced}`);
      await syncMolFile("Synced example molecule to 3D viewer");
    } catch (error) {
      console.error("Error loading example:", error);
    }
  };

  const handleToggleButtonVisibility = (button: ToolbarButtonKey) => {
    setHiddenButtons((prev) =>
      prev.includes(button)
        ? prev.filter((value) => value !== button)
        : [...prev, button]
    );
  };

  const handleSelectInputChange = (value: string) => {
    const parsed = value.replace(/\s+/g, "");
    setSelectInput(parsed);
    setSelectInputError(Boolean(parsed) && !selectionRegex.test(parsed));
  };

  const handleSelectAtoms = () => {
    if (!ketcherApi || !selectInput || selectInputError) return;
    const ids = selectInput.split(",").map((item) => parseInt(item, 10));
    ketcherApi.selectAtomsById(ids);
    appendToTerminal(`Selected atoms: ${ids.join(", ")}`);
  };

  const handleShowAtomIds = () => {
    if (!ketcherApi) return;
    const atoms = ketcherApi.getSelectedAtomId();
    appendToTerminal(atoms ? `Selected atoms: ${atoms}` : "No atoms selected");
  };

  const handleCreateHighlight = () => {
    if (!ketcherApi) return;
    const result = ketcherApi.highlightSelection(highlightColor);
    if (!result || !result.lastHighlight) {
      appendToTerminal("No selection to highlight");
      return;
    }
    appendToTerminal(
      `New highlight ${result.lastHighlightID}: ${JSON.stringify(
        result.lastHighlight,
        null,
        2
      )}`
    );
  };

  const handleGetHighlights = () => {
    if (!ketcherApi) return;
    const highlights = ketcherApi.getAllHighlights();
    appendToTerminal(JSON.stringify(highlights, null, 2));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFileName("");
      setSelectedFileContent("");
      return;
    }
    setSelectedFileName(file.name);
    setSelectedFileContent("");
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = () => {
      const content = reader.result;
      if (typeof content === "string") {
        setSelectedFileContent(content);
        appendToTerminal(`Loaded file ${file.name}`);
      }
    };
  };

  const handleRenderFile = async () => {
    if (!ketcherApi || !selectedFileContent) return;
    try {
      await ketcherApi.renderFromCtab(selectedFileContent);
      appendToTerminal(`Rendered file ${selectedFileName || "selected"}`);
      await syncMolFile("Synced uploaded file to 3D viewer");
    } catch (error) {
      console.error("Error rendering file:", error);
    }
  };

  useEffect(() => {
    if (!ketcherApi) return;
    syncMolFile();
  }, [ketcherApi, syncMolFile]);

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-2 text-2xl font-semibold">Molecule Editor</h2>
      <p className="text-sm text-gray-600">
        Full-featured Ketcher workspace with toolbar customization, selection
        utilities, highlighting, and import/export helpers.
      </p>
      <p className="text-xs font-medium text-gray-500">
        Struct service:{" "}
        {usingRemoteStructService
          ? `Indigo @ ${indigoServiceUrl}`
          : "Built-in WASM engine"}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <div>
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setInputMode("draw")}
              className={`px-4 py-2 font-medium transition ${
                inputMode === "draw"
                  ? "rounded bg-primary-600 text-white"
                  : "rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Draw Molecule
            </button>
            <button
              onClick={() => setInputMode("smiles")}
              className={`px-4 py-2 font-medium transition ${
                inputMode === "smiles"
                  ? "rounded bg-primary-600 text-white"
                  : "rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Text Input (SMILES)
            </button>
          </div>

          <div className={`mb-6 ${inputMode === "draw" ? "" : "hidden"}`}>
            {loading && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center text-blue-900">
                Loading Ketcher editor...
              </div>
            )}
            <div
              className="relative w-full max-w-full overflow-hidden rounded-lg border-2 border-gray-300 bg-white"
              style={{ minHeight: "640px", height: "75vh" }}
            >
              <Editor
                key={editorKey}
                staticResourcesUrl={staticResourcesUrl}
                structServiceProvider={structServiceProviderRef.current!}
                buttons={buttonsConfig}
                onInit={(ketcher: Ketcher) => {
                  setKetcherInstance(ketcher);
                  const api = createKetcherApi(ketcher);
                  setKetcherApi(api);
                  if (typeof window !== "undefined") {
                    window.ketcher = ketcher;
                    window.KetcherFunctions = api;
                  }
                  appendToTerminal("Ketcher editor ready");
                  setLoading(false);
                }}
                errorHandler={(message: string) => {
                  console.error("Ketcher error:", message);
                  appendToTerminal(`Ketcher error: ${message}`);
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleGetSmiles}
                className="inline-flex items-center gap-2 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
                disabled={!ketcherInstance}
              >
                <Zap className="h-4 w-4" />
                Get SMILES
              </button>
              <button
                onClick={handleExportMol}
                className="inline-flex items-center gap-2 rounded bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600"
                disabled={!ketcherApi}
              >
                <Download className="h-4 w-4" />
                Export MOL
              </button>
              <button
                onClick={() =>
                  syncMolFile("Synced current structure to 3D viewer")
                }
                className="rounded bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                disabled={!ketcherApi}
              >
                Sync 3D Viewer
              </button>
              <button
                onClick={() =>
                  loadExampleMolecule("CC(C)Cc1ccc(cc1)[C@@H](C)C(O)=O")
                }
                className="rounded bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600"
                disabled={!ketcherInstance}
              >
                Load Ibuprofen
              </button>
              <button
                onClick={() =>
                  loadExampleMolecule("CN1C=NC2=C1C(=O)N(C(=O)N2C)C")
                }
                className="rounded bg-gray-500 px-4 py-2 font-medium text-white hover:bg-gray-600"
                disabled={!ketcherInstance}
              >
                Load Caffeine
              </button>
            </div>
          </div>

          <div className={`mb-6 ${inputMode === "smiles" ? "" : "hidden"}`}>
            <label className="mb-2 block text-sm font-medium">
              Enter SMILES String
            </label>
            <textarea
              value={smilesInput}
              onChange={handleSmilesInputChange}
              placeholder="e.g., CC(C)Cc1ccc(cc1)[C@@H](C)C(O)=O (Ibuprofen)"
              className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
            />
            <button
              onClick={handleApplySmiles}
              className="mt-2 rounded bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700"
            >
              Apply SMILES
            </button>
          </div>

          {smiles && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-1 text-sm font-medium text-gray-700">
                Current SMILES
              </p>
              <p className="break-all font-mono text-sm text-blue-900">{smiles}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (smiles) {
                  navigator.clipboard.writeText(smiles);
                  appendToTerminal("Copied SMILES to clipboard");
                }
              }}
              className="inline-flex items-center gap-2 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              disabled={!smiles}
            >
              <Copy className="h-4 w-4" />
              Copy SMILES
            </button>
            <button
              onClick={handleExportMol}
              className="inline-flex items-center gap-2 rounded bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
              disabled={!ketcherApi}
            >
              <Download className="h-4 w-4" />
              Export MOL
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <ControlCard title="Selection Tools">
            <div className="flex gap-2">
              <button
                onClick={() => ketcherApi?.selectAll()}
                className="flex-1 rounded bg-blue-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                disabled={!ketcherApi}
              >
                Select All
              </button>
              <button
                onClick={() => ketcherApi?.clearSelection()}
                className="flex-1 rounded border border-blue-500 px-3 py-2 text-xs font-semibold text-blue-600 disabled:opacity-50"
                disabled={!ketcherApi}
              >
                Clear
              </button>
            </div>
            <button
              onClick={handleShowAtomIds}
              className="w-full rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              disabled={!ketcherApi}
            >
              Get Selected Atom ID
            </button>
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Select atoms by ID
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={selectInput}
                  onChange={(event) =>
                    handleSelectInputChange(event.target.value)
                  }
                  placeholder="1,2,3"
                  className={`flex-1 rounded border px-3 py-2 text-sm font-mono focus:outline-none ${
                    selectInputError ? "border-red-400" : "border-gray-300"
                  }`}
                />
                <button
                  onClick={handleSelectAtoms}
                  className="rounded bg-primary-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  disabled={!ketcherApi || !selectInput || selectInputError}
                >
                  Select
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Comma-separated integers, no spaces.
              </p>
            </div>
          </ControlCard>

          <ControlCard title="Highlighting">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={highlightColor}
                onChange={(event) => setHighlightColor(event.target.value)}
                className="h-10 w-10 cursor-pointer rounded border border-gray-300"
              />
              <button
                onClick={handleCreateHighlight}
                className="flex-1 rounded bg-blue-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                disabled={!ketcherApi}
              >
                Highlight Selection
              </button>
              <button
                onClick={() => {
                  ketcherApi?.clearHighlights();
                  appendToTerminal("Cleared highlights");
                }}
                className="rounded border border-blue-500 px-3 py-2 text-xs font-semibold text-blue-600 disabled:opacity-50"
                disabled={!ketcherApi}
              >
                Clear
              </button>
            </div>
            <button
              onClick={handleGetHighlights}
              className="w-full rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              disabled={!ketcherApi}
            >
              Get All Highlights
            </button>
          </ControlCard>

          <ControlCard title="Toolbar Customization">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
              <button
                onClick={() => setHiddenButtons([])}
                className="rounded border border-gray-300 px-2 py-1"
              >
                Show All
              </button>
              <button
                onClick={() => setHiddenButtons(Array.from(allToolbarButtons))}
                className="rounded border border-gray-300 px-2 py-1"
              >
                Hide All
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto rounded border border-gray-200 bg-white">
              {allToolbarButtons.map((button) => (
                <label
                  key={button}
                  className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs last:border-b-0"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={!hiddenButtons.includes(button)}
                    onChange={() => handleToggleButtonVisibility(button)}
                  />
                  <span>{toolbarButtonLabels[button]}</span>
                </label>
              ))}
            </div>
          </ControlCard>

          <ControlCard title="Import MDL Mol (V2000)">
            <input
              type="file"
              accept=".mol,.sdf,.mdl,.txt"
              onChange={handleFileChange}
              className="w-full cursor-pointer rounded border border-dashed border-gray-300 bg-white px-3 py-2 text-xs"
            />
            {selectedFileName && (
              <p className="text-xs text-gray-600">Selected: {selectedFileName}</p>
            )}
            <button
              onClick={handleRenderFile}
              className="w-full rounded bg-primary-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              disabled={!ketcherApi || !selectedFileContent}
            >
              Render File in Editor
            </button>
          </ControlCard>
        </div>
      </div>

      <div className="mt-6">
        <ControlCard title="Terminal Output">
          <textarea
            value={terminalOutput}
            readOnly
            className="h-40 w-full resize-none rounded border border-gray-300 bg-white p-3 font-mono text-xs"
          />
          <button
            onClick={() => setTerminalOutput("")}
            className="mt-2 rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600"
          >
            Clear Terminal
          </button>
        </ControlCard>
      </div>
    </div>
  );
};
