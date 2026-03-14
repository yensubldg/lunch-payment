import { GoogleGenAI } from "@google/genai";

let genaiClient: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!genaiClient) {
    const config = useRuntimeConfig();
    genaiClient = new GoogleGenAI({ apiKey: config.googleGenaiApiKey });
  }
  return genaiClient;
}

export interface BillExtractResult {
  title: string;
  items: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
}

export interface ImageInput {
  base64: string;
  mimeType: string;
}

export async function extractBillsFromImages(
  images: ImageInput[]
): Promise<BillExtractResult> {
  const genai = getGenAI();

  const imageParts = images.map(img => ({
    inlineData: {
      mimeType: img.mimeType || "image/jpeg",
      data: img.base64,
    },
  }));

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          ...imageParts,
          {
            text: `Phân tích ảnh hóa đơn/bill cơm trưa này. Trích xuất thông tin và trả về JSON theo format sau (KHÔNG thêm markdown code block, chỉ trả raw JSON):
{
  "title": "Tên quán hoặc mô tả bill",
  "items": [
    { "name": "Tên người", "amount": số tiền (VND, integer) }
  ],
  "totalAmount": tổng tiền (VND, integer)
}

Lưu ý:
- Phân tích tất cả các ảnh được tải lên vì chúng có thể là nhiều trang của cùng một bill
- Số tiền phải là số nguyên (VND), làm tròn lên nếu cần
- Nếu ảnh là bill chia tiền nhóm, extract tên từng người và số tiền tương ứng
- Nếu ảnh là bill quán ăn, extract từng món và giá
- totalAmount là tổng tất cả items`,
          },
        ],
      },
    ],
  });

  const text = response.text || "";
  // Clean up the response - remove markdown code blocks if present
  const cleanedText = text
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText) as BillExtractResult;
  } catch (e) {
    throw new Error(`Failed to parse GenAI response: ${cleanedText}`);
  }
}
