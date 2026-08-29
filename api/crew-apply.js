const { sanitizeHeaderValue, isValidEmail, isRateLimited } = require("./_utils");

const TO = "info@deestilburg.nl";
const FROM_ADDRESS = "info@deestilburg.nl";
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_ATTACHMENTS_BASE64_BYTES = 4 * 1024 * 1024; /* ~3MB ruwe bestanden na base64, zelfde grens als de browser-check */

function hasAllowedExtension(filename) {
  const name = String(filename || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (isRateLimited(req)) {
    res.status(429).json({ error: "Te veel verzoeken. Probeer het over een paar minuten opnieuw." });
    return;
  }

  const { naam, email, telefoon, bericht, website, cv, motivatie } = req.body || {};

  /* Honeypot: onzichtbaar veld voor mensen, bots vullen het vaak in.
     Doe alsof het gelukt is, zonder daadwerkelijk te versturen. */
  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!naam || !email) {
    res.status(400).json({ error: "Naam en e-mailadres zijn verplicht." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Vul een geldig e-mailadres in." });
    return;
  }

  const naamVeilig = sanitizeHeaderValue(naam) || "Sollicitant";

  const candidates = [
    ["cv", cv],
    ["motivatie", motivatie],
  ].filter(([, file]) => file && typeof file.content === "string");

  for (const [field, file] of candidates) {
    if (!hasAllowedExtension(file.filename)) {
      res.status(400).json({ error: "Alleen pdf, doc of docx-bestanden zijn toegestaan." });
      return;
    }
  }

  const totalBase64Bytes = candidates.reduce((sum, [, file]) => sum + file.content.length, 0);
  if (totalBase64Bytes > MAX_ATTACHMENTS_BASE64_BYTES) {
    res.status(400).json({ error: "De bijlages zijn samen te groot. Mail ze liever direct naar personeel@deestilburg.nl." });
    return;
  }

  const attachments = candidates.map(([field, file]) => ({
    filename: file.filename || (field === "cv" ? "cv.pdf" : "motivatiebrief.pdf"),
    content: file.content,
  }));

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${naamVeilig} <${FROM_ADDRESS}>`,
        to: [TO],
        reply_to: email,
        subject: `Sollicitatie website — ${naamVeilig}`,
        text:
          `Naam: ${naam}\n` +
          `E-mail: ${email}\n` +
          `Telefoon: ${telefoon || "-"}\n\n` +
          `Bericht:\n${bericht || "-"}`,
        ...(attachments.length ? { attachments } : {}),
      }),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      console.error("Resend error:", resendRes.status, detail);
      res.status(502).json({ error: "Verzenden via Resend is mislukt." });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Er ging iets mis bij het versturen." });
  }
};
