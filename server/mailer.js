// Sends the recovery mail. With BREVO_API_KEY set it calls Brevo's HTTP API (free plan, 300 a
// day, no card); without it nothing leaves the process, so local runs and tests need no account.
const logger = require("./logger");

const API = "https://api.brevo.com/v3/smtp/email";

function createMailer({ apiKey, senderEmail, senderName = "Cash Your Coupons" } = {}) {
  return {
    async send(to, subject, text) {
      if (!apiKey || !senderEmail) {
        logger.warn("mail not sent: BREVO_API_KEY or MAIL_FROM is not set", { subject });
        return;
      }
      const res = await fetch(API, {
        method: "POST",
        headers: { "api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          sender: { email: senderEmail, name: senderName },
          to: [{ email: to }],
          subject,
          textContent: text,
        }),
      });
      if (!res.ok) throw new Error(`mail provider answered ${res.status}`);
    },
  };
}

module.exports = { createMailer };
