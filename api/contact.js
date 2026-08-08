// ============================================================================
// Ovi's Fix — /api/contact (Vercel Serverless Function)
// Node.js runtime. Sends contact-form submissions via Resend
// (https://resend.com). See README.md for how to get an API key.
//
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY   required — your Resend API key
//   TO_EMAIL         optional — defaults to contact.ovisfix@gmail.com
//   FROM_EMAIL       optional — defaults to Resend's shared test sender
// ============================================================================

const TO_EMAIL_DEFAULT = "contact.ovisfix@gmail.com";
const FROM_EMAIL_DEFAULT = "onboarding@resend.dev";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid request body" });
    }
  }

  const name = (body.name || "").toString().trim().slice(0, 200);
  const email = (body.email || "").toString().trim().slice(0, 200);
  const phone = (body.phone || "").toString().trim().slice(0, 40);
  const message = (body.message || "").toString().trim().slice(0, 5000);

  const emailOk = !email || isValidEmail(email);
  const phoneDigits = phone.replace(/\D/g, "").length;

  if (!name || phoneDigits < 7 || !emailOk || !message) {
    return res.status(400).json({
      success: false,
      error: "Please provide a valid name, phone number, and message.",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — see README.md to configure email sending.");
    return res.status(500).json({
      success: false,
      error: "Email sending isn't configured yet on the server. Please email or WhatsApp us directly for now.",
    });
  }

  const toEmail = process.env.TO_EMAIL || TO_EMAIL_DEFAULT;
  const fromEmail = process.env.FROM_EMAIL || FROM_EMAIL_DEFAULT;

  const html = `
    <div style="font-family:-apple-system,Arial,sans-serif;font-size:14px;color:#111;">
      <h2 style="margin:0 0 12px;">New message from the Ovi's Fix website</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>`;

  try {
    const emailPayload = {
      from: fromEmail,
      to: [toEmail],
      subject: `New website inquiry from ${name}`,
      html,
    };
    if (email) emailPayload.reply_to = email;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resendRes.ok) {
      const detail = await resendRes.text();
      console.error("Resend API error:", resendRes.status, detail);
      return res.status(502).json({
        success: false,
        error: "The message could not be delivered. Please try WhatsApp instead.",
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please try again or contact us on WhatsApp.",
    });
  }
}
