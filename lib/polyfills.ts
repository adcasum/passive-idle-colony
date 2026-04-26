import { getRandomValues as expoCryptoGetRandomValues } from "expo-crypto";
import { Buffer } from "buffer";

// Buffer global
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).Buffer = Buffer;

class CryptoShim {
  getRandomValues = expoCryptoGetRandomValues;
}

const webCrypto = typeof crypto !== "undefined" ? crypto : new CryptoShim();

(() => {
  if (typeof crypto === "undefined") {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    });
  }
})();
