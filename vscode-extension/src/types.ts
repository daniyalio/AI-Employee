export type Provider = 'ollama' | 'openai-compatible';

export type ExplanationRequest = {
  code: string;
  language: string;
  fileName: string;
  question?: string;
};

export type ProviderConfig = {
  provider: Provider;
  ollamaBaseUrl: string;
  ollamaModel: string;
  openAICompatibleBaseUrl: string;
  openAICompatibleModel: string;
};

export type SupportConfig = {
  buyMeACoffeeUrl: string;
  githubSponsorsUrl: string;
};
