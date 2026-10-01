import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TO_EMAIL = "sajadnazar928@gmail.com";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional().default(""),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(1).max(5000),
});

export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["RESEND_API_KEY"];

    if (!apiKey) {
      throw new Error("Email sending is not configured.");
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Portfolio <onboarding@resend.dev>",
        to: [TO_EMAIL],
        reply_to: data.email,
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Resend failed [${res.status}]: ${errorBody}`);
      throw new Error(`Could not send the message [${res.status}]`);
    }

    return { ok: true as const };
  });
