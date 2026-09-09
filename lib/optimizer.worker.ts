import { recommend } from "./optimizer";
import type { Build } from "./model";
self.onmessage = (event: MessageEvent<Build>) => {
  try {
    self.postMessage({ results: recommend(event.data) });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Optimization failed.",
    });
  }
};
