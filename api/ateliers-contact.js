const TO = "ateliers@deestilburg.nl";
const FROM_ADDRESS = "ateliers@deestilburg.nl";

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

  const { naam, email, telefoon, bericht } = req.body || {};

  if (!naam || !email) {
    res.status(400).json({ error: "Naam en e-mailadres zijn verplicht." });
    return;
  }

  const naamVeilig = sanitizeHeaderValue(naam) || "Bezoeker website";

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
        subject: `Interesse atelier — ${naamVeilig}`,
        text:
          `Naam: ${naam}\n` +
          `E-mail: ${email}\n` +
          `Telefoon: ${telefoon || "-"}\n\n` +
          `Bericht:\n${bericht || "-"}`,
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
