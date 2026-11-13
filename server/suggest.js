// Suggests a category for a new listing from its name and details. Two models:
// a keyword rule baseline and a naive Bayes classifier trained on data/train.json.
// The seller always confirms the suggestion; it never changes a listing by itself.
const { CATEGORIES } = require("./validation");
const train = require("./data/train.json");

const FALLBACK = "Others";
const STOP = new Set(["the", "and", "off", "any", "one", "for", "all", "only", "with", "above"]);

const tokens = (text) =>
  text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));

// Baseline: the first category with a keyword in the text. Hand-written, no training.
const KEYWORDS = {
  Food: ["pizza", "burger", "cafe", "restaurant", "dinner", "lunch", "bakery", "grocery", "food"],
  Clothes: ["shirt", "jeans", "dress", "kurta", "jacket", "wear", "saree", "clothing"],
  Travel: ["flight", "hotel", "bus", "cab", "trip", "tour", "resort", "travel"],
  Electronics: ["phone", "laptop", "earphones", "camera", "tv", "charger", "gadget"],
  "Online Gaming": ["game", "gaming", "steam", "diamonds", "esports", "skins"],
  Beauty: ["beauty", "salon", "makeup", "skincare", "perfume", "hair", "nail"],
  "Health & Wellness": ["gym", "yoga", "pharmacy", "medicine", "dental", "spa", "fitness"],
};

function baseline(name, details = "") {
  const words = new Set(tokens(`${name} ${details}`));
  const hit = Object.entries(KEYWORDS).find(([, list]) => list.some((word) => words.has(word)));
  return hit ? hit[0] : FALLBACK;
}

// Multinomial naive Bayes with add-one smoothing, trained once at load.
const vocabulary = new Set();
const counts = Object.fromEntries(CATEGORIES.map((c) => [c, new Map()]));
const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
const docs = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
for (const [name, details, category] of train) {
  docs[category] += 1;
  for (const word of tokens(`${name} ${details}`)) {
    vocabulary.add(word);
    counts[category].set(word, (counts[category].get(word) || 0) + 1);
    totals[category] += 1;
  }
}

// Returns { category, confidence }. With no known word the answer is "Others" at 0 confidence.
function suggest(name, details = "") {
  const words = tokens(`${name} ${details}`).filter((word) => vocabulary.has(word));
  if (words.length === 0) return { category: FALLBACK, confidence: 0 };
  const scores = CATEGORIES.map((category) => {
    let score = Math.log((docs[category] + 1) / (train.length + CATEGORIES.length));
    for (const word of words) {
      const seen = counts[category].get(word) || 0;
      score += Math.log((seen + 1) / (totals[category] + vocabulary.size));
    }
    return [category, score];
  });
  const best = Math.max(...scores.map(([, s]) => s));
  const sum = scores.reduce((acc, [, s]) => acc + Math.exp(s - best), 0);
  const [category] = scores.find(([, s]) => s === best);
  return { category, confidence: Math.round((1 / sum) * 100) / 100 };
}

function accuracy(predict, rows) {
  const right = rows.filter(([name, details, category]) => predict(name, details) === category);
  return right.length / rows.length;
}

module.exports = { suggest, baseline, accuracy };
