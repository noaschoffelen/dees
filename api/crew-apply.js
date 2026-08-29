const TO = "info@deestilburg.nl";
const FROM_ADDRESS = "info@deestilburg.nl";

/* Voorkomt header-injectie en houdt de weergavenaam schoon:
   geen regeleindes, geen aanhalingstekens/haakjes die het "Naam <adres>"-formaat breken. */
function sanitizeHeaderValue(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/["<>]/g, "")
    .trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { naam, email, telefoon, bericht, cv, motivatie } = req.body || {};

  if (!naam || !email) {
    res.status(400).json({ error: "Naam en e-mailadres zijn verplicht." });
    return;
  }

  const naamVeilig = sanitizeHeaderValue(naam) || "Sollicitant";

  const attachments = [];
  if (cv && typeof cv.content === "string") {
    attachments.push({ filename: cv.filename || "cv.pdf", content: cv.content });
  }
  if (motivatie && typeof motivatie.content === "string") {
    attachments.push({ filename: motivatie.filename || "motivatiebrief.pdf", content: motivatie.content });
  }

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
