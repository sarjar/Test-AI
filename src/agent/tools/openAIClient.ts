import { ChatOpenAI } from "@langchain/openai";

/**
 * OpenAI Client Configuration
 *
 * Creates and configures ChatOpenAI instance for LLM operations
 * Handles API key validation and client settings
 */

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "OPENAI_API_KEY is not configured. Please set your OpenAI API key in the environment variables.",
    );
  }

  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    maxRetries: 2,
    timeout: 20000,
    maxTokens: 1000,
    openAIApiKey: apiKey,
  });
};

export default getOpenAIClient;
