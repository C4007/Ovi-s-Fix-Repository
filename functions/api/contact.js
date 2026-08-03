// ============================================================================
// Ovi's Fix — /api/contact (Cloudflare Pages Function)
// Mirrors api/contact.js but written for Cloudflare's Functions convention
// (onRequestPost + Fetch API Request/Response). Use this file if you deploy
// to Cloudflare Pages instead of Vercel — you only need one of the two.
//
// Env vars (set in Cloudflare Pages → Settings → Environment Variables):
//   RESEND_API_KEY   required — your Resend API key
//   TO_EMAIL         optional — defaults to contact.ovisfix@gmail.com
//   FROM_EMAIL       optional — defaults to Resend's shared test sender
// ============================================================================

const TO_EMAIL_DEFAULT = "contact.ovisfix@gmail.com";
const FROM_EMAIL_DEFAULT = "Ovi's Fix Website <onboarding@resend.dev>";

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

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return json({ success: false, error: "Invalid request body" }, 400);
  }

  const name = (body.name || "").toString().trim().slice(0, 200);
  const email = (body.email || "").toString().trim().slice(0, 200);
  const phone = (body.phone || "").toString().trim().slice(0, 40);
  const message = (body.message || "").toString().trim().slice(0, 5000);

  const emailOk = !email || isValidEmail(email);
  const phoneDigits = phone.replace(/\D/g, "").length;

  if (!name || phoneDigits < 7 || !emailOk || !message) {
    return json(
      { success: false, error: "Please provide a valid name, phone number, and message." },
      400
    );
  }

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return json(
      {
        success: false,
        error: "Email sending isn't configured yet on the server. Please email or WhatsApp us directly for now.",
      },
      500
    );
  }

  const toEmail = env.TO_EMAIL || TO_EMAIL_DEFAULT;
  const fromEmail = env.FROM_EMAIL || FROM_EMAIL_DEFAULT;

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
      return json(
        { success: false, error: "The message could not be delivered. Please try WhatsApp instead." },
        502
      );
    }

    return json({ success: true }, 200);
  } catch (err) {
    return json(
      { success: false, error: "Something went wrong. Please try again or contact us on WhatsApp." },
      500
    );
  }
}
