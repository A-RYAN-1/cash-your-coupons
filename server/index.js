const { createApp } = require("./app");
const { PORT } = require("./config");
const logger = require("./logger");

createApp().listen(PORT, () => {
  logger.info("server started", { port: PORT });
});
