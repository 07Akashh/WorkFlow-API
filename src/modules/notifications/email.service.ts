import nodemailer from "nodemailer";

import { env } from "../../config/env.js";

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function verifyEmailTransport(): Promise<void> {
  // JSON transport is intentionally used for local development and tests.
  if (env.SMTP_HOST) await transporter.verify();
}

export async function sendAssignmentEmail({
  email,
  taskTitle,
}: {
  email: string;
  taskTitle: string;
}) {
  const result = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: `Task assigned: ${taskTitle}`,
    text: `You have been assigned to the task: ${taskTitle}`,
    html: `<p>You have been assigned to the task: <strong>${taskTitle}</strong></p>`,
  });

  return result.messageId;
}
