import { GoogleGenAI } from "@google/genai";
import { LabTest, Patient, TestResult } from "../types";

export const analyzeLabResults = async (
  patient: Patient,
  results: TestResult[],
  allTests: LabTest[]
): Promise<string> => {
  // 1. Check for internet connection explicitly
  if (!navigator.onLine) {
    return "لا يمكن إجراء التحليل الذكي في وضع عدم الاتصال (Offline). يرجى التحقق من الإنترنت.";
  }

  // 2. Safe access to process.env to prevent "process is not defined" crash
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : null;

  if (!apiKey) {
    return "مفتاح الربط (API Key) غير موجود. لا يمكن استخدام ميزات الذكاء الاصطناعي.";
  }

  try {
    // 3. Initialize client only when needed
    const ai = new GoogleGenAI({ apiKey });

    // Construct a readable list of results for the AI
    const resultSummary = results.map(r => {
      const testInfo = allTests.find(t => t.id === r.testId);
      return `- ${testInfo?.name || 'Unknown Test'}: ${r.value} ${testInfo?.unit} (Range: ${testInfo?.normalRange})`;
    }).join('\n');

    const prompt = `
      You are an expert medical laboratory assistant. 
      Analyze the following lab results for a patient.
      
      Patient Info:
      - Age: ${patient.age}
      - Gender: ${patient.gender}
      
      Results:
      ${resultSummary}

      Instructions:
      1. Provide a brief summary of the findings in Arabic.
      2. Highlight any abnormal values.
      3. Suggest general lifestyle advice or follow-up doctor types.
      4. Output MUST be in Arabic.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "لم يتم استلام تحليل من النظام الذكي.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "عذراً، حدث خطأ أثناء الاتصال. قد يكون السبب ضعف الإنترنت أو انتهاء صلاحية المفتاح.";
  }
};