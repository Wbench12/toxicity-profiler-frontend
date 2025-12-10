import type { Ketcher } from "ketcher-core";
import type { KetcherApi } from "@/utils/ketcherApi";

declare global {
  interface Window {
    ketcher?: Ketcher;
    KetcherFunctions?: KetcherApi;
  }
}

export {};
