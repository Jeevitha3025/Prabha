import schemes from "../data/schemes.json";

type Scheme = {
  id: string;
  name: string;
  shortName: string;
  state: string;
  categories: string[];
  targetUsers: string[];
  benefit: string;
  eligibility: string[];
  documents: string[];
  keywords: string[];
  sourceUrl: string;
};

const schemeData = schemes as Scheme[];

/**
 * Convert a sentence into simple searchable words.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3);
}

/**
 * Retrieve schemes relevant to the user's question.
 */
export function retrieveSchemes(
  query: string,
  topK: number = 3
): Scheme[] {
  const queryWords = tokenize(query);

  const scoredSchemes = schemeData.map((scheme) => {
    let score = 0;

    const searchableFields = [
      ...scheme.categories,
      ...scheme.targetUsers,
      ...scheme.keywords,
      scheme.name,
      scheme.shortName,
      scheme.benefit,
      ...scheme.eligibility,
    ];

    const searchableText = searchableFields
      .join(" ")
      .toLowerCase();

    for (const word of queryWords) {
      if (searchableText.includes(word)) {
        score += 1;
      }
    }

    return {
      scheme,
      score,
    };
  });

  return scoredSchemes
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.scheme);
}