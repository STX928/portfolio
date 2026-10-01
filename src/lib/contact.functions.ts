import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TO_EMAIL = "sajadnazar928@gmail.com";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional().default(""),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(1).max(5000),
});

const b64 = (s: string) =>
  btoa(
    Array.from(new TextEncoder().encode(s), (b) => String.fromCharCode(b)).join(
      "",
    ),
  );

const header = (v: string) =>
  /^[\x00-\x7F]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`;

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["GOOGLE_MAIL_API_KEY"];
    if (!lovableKey || !connectionKey) {
      throw new Error("Email sending is not configured yet.");
    }

    const subject = data.subject
      ? `Portfolio: ${data.subject}`
      : `Portfolio message from ${data.name}`;

    const body = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      data.phone ? `Phone: ${data.phone}` : null,
      data.subject ? `Subject: ${data.subject}` : null,
      "",
      data.message,
    ]
      .filter(Boolean)
      .join("\n");

    const raw = b64(
      [
        `To: ${TO_EMAIL}`,
        `Reply-To: ${data.email}`,
        `Subject: ${header(subject)}`,
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        body,
      ].join("\r\n"),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Gmail send failed [${res.status}]: ${errorBody}`);
      throw new Error(`Could not send the message [${res.status}]`);
    }

    return { ok: true as const };
  });
