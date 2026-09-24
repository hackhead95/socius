// Stand-in for @mlc-ai/web-llm in the single-file Claude artifact build (`vite build --mode artifact`
// aliases the package here), so the large on-device AI library is never inlined into socius.html.
// The artifact build does not offer the on-device option; these only exist to satisfy imports.

export class MLCEngine {
  constructor() {
    throw new Error('The on-device model is not part of this build.');
  }
}

export async function hasModelInCache(): Promise<boolean> {
  return false;
}

export async function deleteModelAllInfoInCache(): Promise<void> {}
