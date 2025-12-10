declare global {
  interface Window {
    process?: {
      env?: Record<string, string>;
      version?: string;
      versions?: Record<string, string>;
      nextTick?: (cb: (...args: unknown[]) => void, ...args: unknown[]) => void;
    };
    global?: typeof window;
  }
}

const ensureProcessShim = () => {
  if (typeof window === "undefined") {
    return;
  }

  const globalAny = window as any;
  if (!globalAny.process) {
    globalAny.process = {
      env: {},
      version: "",
      versions: {},
      nextTick: (cb: (...args: unknown[]) => void, ...args: unknown[]) => {
        Promise.resolve().then(() => cb(...args));
      },
    };
  }

  if (!globalAny.global) {
    globalAny.global = globalAny;
  }
};

ensureProcessShim();

export {}; // Ensure this file is treated as a module
