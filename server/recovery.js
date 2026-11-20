// Password recovery: "forgot" mails a one-time code, "reset" trades the code for a new password.
// The answer to "forgot" is the same whether or not the email has an account.
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("./db");
const logger = require("./logger");
const { validateCredentials } = require("./validation");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0, O, 1, I
const CODE_LENGTH = 8;
const CODE_MINUTES = 30;
const MAX_ATTEMPTS = 5;
const MAX_MAILS_PER_HOUR = 3;

const newCode = () =>
  Array.from({ length: CODE_LENGTH }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");
const normalize = (code) =>
  typeof code === "string" ? code.replace(/\s|-/g, "").toUpperCase() : "";

function registerRecoveryRoutes(app, { mailer, authRateLimit, fail, serverError }) {
  app.post("/auth/forgot", authRateLimit, async (req, res) => {
    const { error, email } = validateCredentials(
      { ...req.body, password: "x" },
      { strictPassword: false }
    );
    if (error) return fail(res, 400, error);
    const reply = () =>
      res.json({ message: "If that email has an account, a code is on its way." });
    try {
      const user = (await pool.query("SELECT id FROM users WHERE email = $1", [email])).rows[0];
      if (!user) return reply();
      const recent = await pool.query(
        `SELECT count(*)::int AS n FROM password_resets
         WHERE user_id = $1 AND created_at > now() - interval '1 hour'`,
        [user.id]
      );
      if (recent.rows[0].n >= MAX_MAILS_PER_HOUR) return reply();
      const code = newCode();
      await pool.query(
        `INSERT INTO password_resets (user_id, code_hash, expires_at)
         VALUES ($1, $2, now() + $3 * interval '1 minute')`,
        [user.id, hashCode(code), CODE_MINUTES]
      );
      try {
        await mailer.send(
          email,
          "Your Cash Your Coupons reset code",
          `Your code is ${code}. It works for ${CODE_MINUTES} minutes. ` +
            "If you did not ask for it, ignore this mail; your password has not changed."
        );
      } catch (err) {
        logger.error("recovery mail failed", { id: req.id, message: err.message });
      }
      return reply();
    } catch (err) {
      return serverError(req, res, err, "forgot password failed");
    }
  });

  app.post("/auth/reset", authRateLimit, async (req, res) => {
    const { error, email, password } = validateCredentials(req.body);
    if (error) return fail(res, 400, error);
    const code = normalize(req.body.code);
    const invalid = () => fail(res, 400, "That code is wrong or has expired");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Lock the newest live code of this account so two guesses cannot both count as the first.
      const row = (
        await client.query(
          `SELECT r.id, r.user_id, r.code_hash, r.attempts
           FROM password_resets r JOIN users u ON u.id = r.user_id
           WHERE u.email = $1 AND r.used_at IS NULL AND r.expires_at > now() AND r.attempts < $2
           ORDER BY r.created_at DESC LIMIT 1 FOR UPDATE OF r`,
          [email, MAX_ATTEMPTS]
        )
      ).rows[0];
      if (!row) {
        await client.query("COMMIT");
        return invalid();
      }
      const given = Buffer.from(hashCode(code));
      const stored = Buffer.from(row.code_hash);
      if (!crypto.timingSafeEqual(given, stored)) {
        await client.query("UPDATE password_resets SET attempts = attempts + 1 WHERE id = $1", [
          row.id,
        ]);
        await client.query("COMMIT");
        return invalid();
      }
      const hashed = await bcrypt.hash(password, 10);
      await client.query("UPDATE users SET password = $2 WHERE id = $1", [row.user_id, hashed]);
      await client.query(
        "UPDATE password_resets SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
        [row.user_id]
      );
      await client.query("COMMIT");
      return res.json({ message: "Password changed. Sign in with the new one." });
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      return serverError(req, res, err, "reset password failed");
    } finally {
      client.release();
    }
  });
}

module.exports = { registerRecoveryRoutes };
