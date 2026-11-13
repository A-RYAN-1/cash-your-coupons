// Held-out evaluation: both models on data/test.json, which the classifier never trains on.
// Run: npm run eval
const { suggest, baseline, accuracy } = require("./suggest");
const test = require("./data/test.json");

const rule = accuracy((name, details) => baseline(name, details), test);
const model = accuracy((name, details) => suggest(name, details).category, test);
console.log(`held-out coupons: ${test.length}`);
console.log(`keyword baseline accuracy: ${(rule * 100).toFixed(1)}%`);
console.log(`naive Bayes accuracy:      ${(model * 100).toFixed(1)}%`);
