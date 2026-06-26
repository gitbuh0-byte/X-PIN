
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Generates exciting casino-style commentary for game results.
 * Uses Gemini 3 Flash for low-latency, high-energy text generation.
 */
export const generateGameCommentary = async (
  winner: string,
  winAmount: number,
  playerCount: number
): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: "You are an elite, high-energy casino commentator for 'X PIN'. Generate a short, hype sentence (max 15 words) congratulating the winner. Use gambling slang and keep it intense."
    });
    const prompt = `Winner: ${winner}. Amount Won: $${winAmount}. Players in room: ${playerCount}.`;
    const response = await model.generateContent(prompt);

    return response.response.text() || `UNBELIEVABLE! ${winner} clears the table for $${winAmount}!`;
  } catch (error) {
    console.error("Commentary Engine Error:", error);
    return `THE HOUSE SHUDDERS! ${winner} takes it all!`;
  }
};

/**
 * Cryptic AI oracle for the chat interface.
 * Uses Gemini 3 Pro for more sophisticated, "mystical" persona.
 */
export const chatWithAiOracle = async (
  userMessage: string,
  history: string[]
): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-pro',
      systemInstruction: "You are the 'X PIN Oracle'. You live within the digital circuitry of this gambling engine. Give cryptic, mystical, and short advice about luck and fortune. Stay in character, be brief, and never encourage irresponsible behavior."
    });
    const prompt = `History:\n${history.join('\n')}\n\nUser: ${userMessage}`;
    const response = await model.generateContent(prompt);

    return response.response.text() || "The mists of probability remain thick...";
  } catch (error) {
    console.error("Oracle Connection Failed:", error);
    return "The circuits hum with static... fortune is silent.";
  }
};
