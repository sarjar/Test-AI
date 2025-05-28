import { ChatOpenAI } from "@langchain/openai";

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  console.log("OPENAI_API_KEY IS SET");

  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
    maxRetries: 3,
    timeout: 30000,
  });
};

export default getOpenAIClient; 