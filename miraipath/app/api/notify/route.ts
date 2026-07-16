/**
 * POST /api/notify
 *
 * Emails a form submission (institution partner inquiry or student
 * consultation request) to the site owner via Gmail SMTP. No third-party
 * email relay is involved — mail flows from this server straight to Gmail.
 *
 * Configuration (server-only env vars; never exposed to the browser):
 *   GMAIL_USER          the Gmail address that sends (and, by default, receives)
 *   GMAIL_APP_PASSWORD  a Google "App Password" for that account (16 chars)
 *   NOTIFY_TO           optional; recipient address (defaults to GMAIL_USER)
 *
 * When the env vars are absent the endpoint returns { ok:false, configured:false }
 * with HTTP 200, so form submission still succeeds (demo mode) without email.
 */
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  type?: "institution_lead" | "consultation";
  data?: Record<string, unknown>;
  reference?: string;
};

function mailConfig() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.NOTIFY_TO || user;
  return { user, pass, to };
}

/**
 * Capability check. The UI calls this so page copy can describe truthfully
 * what happens to a submission in THIS deployment. Never exposes secrets.
 */
export async function GET() {
  const { user, pass } = mailConfig();
  return NextResponse.json({ configured: Boolean(user && pass) });
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function institutionRows(d: Record<string, unknown>): [string, string][] {
  return [
    ["Institution", `${d.institutionName ?? ""} (${d.institutionType ?? ""})`],
    ["Department", `${d.department ?? ""}`],
    ["Contact", `${d.contactName ?? ""} — ${d.role ?? ""}`],
    ["Work email", `${d.workEmail ?? ""}`],
    ["Phone", `${d.phone ?? "—"}`],
    ["Target academic year", `${d.targetAcademicYear ?? ""}`],
    ["Target nationalities", `${d.targetNationalities ?? ""}`],
    ["Programs to promote", `${d.programsToPromote ?? ""}`],
    ["Preferred pilot type", `${d.preferredPilotType ?? ""}`],
    ["Recruitment goals", `${d.recruitmentGoals ?? ""}`],
    ["Current challenge", `${d.currentChallenge ?? ""}`],
  ];
}

function consultationRows(d: Record<string, unknown>): [string, string][] {
  const shortlist = Array.isArray(d.shortlistedProgramIds)
    ? (d.shortlistedProgramIds as string[]).join(", ")
    : "—";
  return [
    ["Reference", `${d.reference ?? ""}`],
    ["Name", `${d.fullName ?? ""}`],
    ["Email", `${d.email ?? ""}`],
    ["Contact method", `${d.contactMethod ?? ""}${d.contactHandle ? ` (${d.contactHandle})` : ""}`],
    ["Preferred language", `${d.preferredLanguage ?? ""}`],
    ["Current country", `${d.currentCountry ?? ""}`],
    ["Living in Japan", d.livingInJapan ? "Yes" : "No"],
    ["Highest education", `${d.highestEducation ?? ""}`],
    ["JLPT level", `${d.jlptLevel ?? ""}`],
    ["Preferred field", `${d.preferredField ?? ""}`],
    ["School type preference", `${d.schoolTypePreference ?? ""}`],
    ["Tuition budget (JPY/yr)", `${d.tuitionBudgetJpy ?? ""}`],
    ["Desired start", `${d.desiredStart ?? "—"}`],
    ["Shortlisted programs", shortlist || "—"],
    ["Consent to record", d.consentToRecord ? "Yes" : "No"],
    ["Consent to contact", d.consentToContact ? "Yes" : "No"],
    ["Message", `${d.message ?? ""}`],
  ];
}

export async function POST(req: Request) {
  const { user, pass, to } = mailConfig();

  if (!user || !pass) {
    // Not configured — let the caller fall back to storage-only (demo mode).
    return NextResponse.json({ ok: false, configured: false });
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { type, data } = body;
  if (!type || !data || (type !== "institution_lead" && type !== "consultation")) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const isLead = type === "institution_lead";
  const rows = isLead ? institutionRows(data) : consultationRows(data);
  const replyTo = (isLead ? data.workEmail : data.email) as string | undefined;
  const subject = isLead
    ? `New partner inquiry — ${data.institutionName ?? "institution"}`
    : `New consultation request — ${data.fullName ?? "student"} (${body.reference ?? data.reference ?? ""})`;

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:14px;color:#101728">
      <h2 style="margin:0 0 12px">${esc(subject)}</h2>
      <p style="color:#46506a;margin:0 0 16px">From MiraiPath Japan (${isLead ? "For Institutions" : "Consult an Advisor"} form).</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr>
                 <td style="padding:6px 12px;border-bottom:1px solid #eef1f6;color:#46506a;white-space:nowrap;vertical-align:top">${esc(k)}</td>
                 <td style="padding:6px 12px;border-bottom:1px solid #eef1f6">${esc(v)}</td>
               </tr>`
          )
          .join("")}
      </table>
    </div>`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: `"MiraiPath Japan" <${user}>`,
      to,
      replyTo: replyTo || undefined,
      subject,
      text,
      html,
    });
    return NextResponse.json({ ok: true, configured: true });
  } catch (err) {
    console.error("notify sendMail failed", err);
    return NextResponse.json({ ok: false, configured: true, error: "send_failed" }, { status: 502 });
  }
}
