import { ChatOpenAI } from "@langchain/openai";

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "OPENAI_API_KEY is not configured. Please set your OpenAI API key in the environment variables.",
    );
  }

  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    maxRetries: 3,
    timeout: 30000,
    openAIApiKey: apiKey,
  });
};

export default getOpenAIClient;
