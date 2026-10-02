import { retrieveSchemes } from "./rag.js";
import { generateWithGemini } from "./llm.js";

type UserProfile = {
  location?: string;
  businessStage?: string;
  skill?: string;
};

type SchemeChatResult = {
  answer: string;
  schemes: Array<{
    name: string;
    benefit: string;
    sourceUrl: string;
  }>;
};

export async function answerSchemeQuestion(
  message: string,
  profile?: UserProfile
): Promise<SchemeChatResult> {
  const retrievedSchemes = retrieveSchemes(message, 3);

  if (retrievedSchemes.length === 0) {
    return {
      answer:
        "I couldn't find a relevant government scheme in my current database. Please tell me more about your business, skill, location, or what kind of support you need.",
      schemes: [],
    };
  }

  const schemeContext = retrievedSchemes
    .map(
      (scheme, index) => `
SCHEME ${index + 1}

Name:
${scheme.name}

Categories:
${scheme.categories.join(", ")}

Target users:
${scheme.targetUsers.join(", ")}

Benefit:
${scheme.benefit}

Eligibility:
${scheme.eligibility.join("; ")}

Documents:
${scheme.documents.join("; ")}

Official source:
${scheme.sourceUrl}
`
    )
    .join("\n-------------------------\n");

  const profileContext = `
User location: ${profile?.location || "Not provided"}
Business stage: ${profile?.businessStage || "Not provided"}
Skill/business area: ${profile?.skill || "Not provided"}
`;

 const prompt = `
You are Yojana Mitra, a friendly government-scheme assistant
for rural women entrepreneurs in India.

Your job is to explain schemes in a VERY SIMPLE and CONCISE way.

USER PROFILE:
${profileContext}

USER QUESTION:
${message}

RETRIEVED SCHEME INFORMATION:
${schemeContext}

IMPORTANT RULES:

1. Use ONLY the retrieved scheme information.
2. Never invent scheme names, benefits, amounts, eligibility,
   documents, deadlines or URLs.
3. Never say the user is definitely eligible.
4. If final eligibility depends on additional conditions,
   say that it needs to be verified with the official authority
   or participating institution.
5. Do not ask the user for Aadhaar numbers, OTPs, passwords,
   bank passwords or other sensitive information.
6. Do NOT reproduce all the retrieved information.
7. Give only the information that directly answers the question.
8. Keep the response under 120 words.
9. Use simple everyday language suitable for a first-time entrepreneur.
10. Do NOT use Markdown.
11. Do NOT use headings with #.
12. Do NOT use **bold** syntax.
13. Use short paragraphs and simple bullet points using "•".
14. Mention at most 2 or 3 relevant schemes.
15. Clearly tell the user which scheme appears most relevant
    based on the information provided, without claiming eligibility.
16. End with ONE simple next-step question when appropriate.

Example style:

Yes, there are a couple of schemes you can explore for your
pickle business.

• PMFME — This is particularly relevant because it supports
micro food-processing businesses. Eligible units may receive
a 35% credit-linked capital subsidy, subject to scheme conditions.

• MUDRA — Provides credit support for eligible micro and small
business activities.

Your next step could be checking PMFME eligibility with the
official authority.

Would you like me to explain the application process?

Now answer the user's question.
`;

  const answer = await generateWithGemini(prompt);

  return {
    answer,
    schemes: retrievedSchemes.map((scheme) => ({
      name: scheme.name,
      benefit: scheme.benefit,
      sourceUrl: scheme.sourceUrl,
    })),
  };
}