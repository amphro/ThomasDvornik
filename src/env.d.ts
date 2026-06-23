/// <reference path="../.astro/types.d.ts" />

interface Env {
  AI: {
    run(
      model: string,
      options: {
        messages: Array<{ role: string; content: string }>;
        max_tokens?: number;
      }
    ): Promise<{ response: string }>;
  };
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;
declare namespace App {
  interface Locals extends Runtime {}
}
