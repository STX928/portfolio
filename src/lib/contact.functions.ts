import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FORMSPREE_URL = "https://formspree.io/f/mppweold";

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
    const res = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`Formspree failed [${res.status}]: ${errorBody}`);
      throw new Error(`Could not send the message [${res.status}]`);
    }

    return { ok: true as const };
  });
