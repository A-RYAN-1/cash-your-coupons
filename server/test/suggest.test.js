const test = require("node:test");
const assert = require("node:assert/strict");
const { suggest, baseline, accuracy } = require("../suggest");
const heldOut = require("../data/test.json");
const train = require("../data/train.json");
const { CATEGORIES } = require("../validation");

test("every labelled row uses a real category and train and test do not overlap", () => {
  for (const [, , category] of [...train, ...heldOut]) assert.ok(CATEGORIES.includes(category));
  const seen = new Set(train.map(([name]) => name));
  assert.deepEqual(
    heldOut.filter(([name]) => seen.has(name)),
    []
  );
});

test("held-out accuracy: the classifier beats the keyword baseline and a fixed floor", () => {
  const rule = accuracy((name, details) => baseline(name, details), heldOut);
  const model = accuracy((name, details) => suggest(name, details).category, heldOut);
  assert.ok(model > rule, `model ${model} must beat baseline ${rule}`);
  assert.ok(model >= 0.55, `model accuracy ${model} fell below 0.55`);
});

test("a clear listing gets its category, text with no known word falls back to Others", () => {
  assert.equal(suggest("Pizza Corner 30% off", "Dine-in").category, "Food");
  assert.deepEqual(suggest("zzzz", "qqqq"), { category: "Others", confidence: 0 });
  const { confidence } = suggest("Steam wallet", "game credits");
  assert.ok(confidence > 0 && confidence <= 1);
});
