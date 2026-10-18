// One JSON line per event. Callers pass ids and codes only, never passwords,
// tokens or todo text.
const write = (level, message, fields) =>
  console.log(JSON.stringify({ level, time: new Date().toISOString(), message, ...fields }));

module.exports = {
  info: (message, fields) => write("info", message, fields),
  error: (message, fields) => write("error", message, fields),
};
