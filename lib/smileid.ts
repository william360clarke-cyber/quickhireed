import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

const LIVE_URL = "https://api.smileidentity.com/v1/id_verification";
const TIMEOUT_MS = 15_000;

const ID_TYPE_MAP: Record<string, string> = {
  ghana_card: "GHANA_CARD",
  passport: "PASSPORT",
  voters_id: "VOTER_ID",
  drivers_license: "DRIVERS_LICENSE",
  nhis: "NHIS",
};

export const ID_TYPE_LABELS: Record<string, string> = {
  GHANA_CARD: "Ghana Card",
  PASSPORT: "Passport",
  VOTER_ID: "Voter's ID",
  DRIVERS_LICENSE: "Driver's Licence",
  NHIS: "NHIS Card",
};

export interface SmileIdConfig {
  mode: string;
  enabled: string;
  partner_id: string;
  api_key: string;
}

export interface SmileIdResult {
  status: "verified" | "failed" | "error";
  summary: string;
  reference: string | null;
  response: string | null;
}

async function getSmileIdPartnerId(): Promise<number | null> {
  const p = await prisma.partner.findUnique({ where: { slug: "smile_id" }, select: { id: true } });
  return p?.id ?? null;
}

export async function getSmileIdConfig(): Promise<SmileIdConfig> {
  const defaults: SmileIdConfig = { mode: "sandbox", enabled: "1", partner_id: "", api_key: "" };
  try {
    const configs = await prisma.partnerConfig.findMany({
      where: { partner: { slug: "smile_id" } },
      select: { configKey: true, configValue: true },
    });
    const cfg = { ...defaults };
    for (const c of configs) {
      if (c.configKey in cfg) (cfg as any)[c.configKey] = c.configValue ?? "";
    }
    return cfg;
  } catch {
    return defaults;
  }
}

export async function setSmileIdConfig(key: string, value: string, isSecret = false): Promise<void> {
  const partnerId = await getSmileIdPartnerId();
  if (!partnerId) return;
  await prisma.partnerConfig.upsert({
    where: { unq_partner_key: { partnerId, configKey: key } },
    update: { configValue: value, isSecret },
    create: { partnerId, configKey: key, configValue: value, isSecret },
  });
}

export async function smileIdLog(
  action: string,
  status: string,
  summary?: string,
  reference?: string,
  meta?: object
): Promise<void> {
  const partnerId = await getSmileIdPartnerId();
  if (!partnerId) return;
  try {
    await prisma.partnerActivityLog.create({
      data: {
        partnerId,
        action,
        status,
        summary: summary ?? null,
        reference: reference ?? null,
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
  } catch {}
}

export async function smileIdWalletCharge(
  amount: number,
  reference: string,
  description: string
): Promise<number | false> {
  const partnerId = await getSmileIdPartnerId();
  if (!partnerId) return false;
  try {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.partnerWallet.findUnique({ where: { partnerId } });
      if (!wallet || Number(wallet.balance) < amount) throw new Error("insufficient");
      const newBalance = Math.round((Number(wallet.balance) - amount) * 100) / 100;
      await tx.partnerWallet.update({ where: { partnerId }, data: { balance: newBalance } });
      const txn = await tx.partnerTransaction.create({
        data: { partnerId, type: "charge", amount, balanceAfter: newBalance, reference, description },
      });
      return txn.id;
    });
  } catch {
    return false;
  }
}

export async function smileIdWalletTopup(
  amount: number,
  paymentMethod: string,
  reference: string,
  description: string
): Promise<number | false> {
  const partnerId = await getSmileIdPartnerId();
  if (!partnerId) return false;
  try {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.partnerWallet.findUnique({ where: { partnerId } });
      if (!wallet) throw new Error("no wallet");
      const nb = Math.round((Number(wallet.balance) + amount) * 100) / 100;
      await tx.partnerWallet.update({ where: { partnerId }, data: { balance: nb } });
      await tx.partnerTransaction.create({
        data: { partnerId, type: "topup", amount, balanceAfter: nb, reference, paymentMethod, description },
      });
      return nb;
    });
  } catch {
    return false;
  }
}

function generateSignature(timestamp: string, partnerId: string, apiKey: string): string {
  return createHmac("sha256", apiKey)
    .update(timestamp + partnerId + "sid_request")
    .digest("base64");
}

function buildResult(
  status: SmileIdResult["status"],
  summary: string,
  jobId: string | null,
  smileType: string,
  idNumber: string,
  action?: string,
  code?: string,
  text?: string
): SmileIdResult {
  return {
    status,
    summary,
    reference: jobId,
    response: JSON.stringify({
      mode: "sandbox", country: "GH", id_type: smileType, id_number: idNumber,
      SmileJobID: jobId, ResultCode: code ?? null, ResultText: text ?? null,
      Actions: action ? { Verify_ID_Number: action } : null,
    }),
  };
}

function sandboxCheck(smileType: string, idNumber: string): SmileIdResult {
  const clean = idNumber.trim().toUpperCase();
  const label = ID_TYPE_LABELS[smileType] ?? smileType;
  if (!clean) return buildResult("failed", "ID number is empty", null, smileType, clean);
  const lastChar = clean[clean.length - 1];
  if (!/\d/.test(lastChar)) return buildResult("failed", "Unrecognised ID number format", null, smileType, clean);
  const digit = parseInt(lastChar, 10);
  const jobId = `SMJ-SANDBOX-${Math.random().toString(16).slice(2, 12).toUpperCase()}`;
  if (digit % 2 === 0) return buildResult("verified", `${label} verified — name matches authority record`, jobId, smileType, clean, "Completed", "1012", "ID Number Validated");
  if (digit === 1) return buildResult("failed", `${label} found but name does not match`, jobId, smileType, clean, "Returned", "1013", "Names not matching");
  if (digit === 3) return buildResult("failed", `${label} is expired`, jobId, smileType, clean, "Returned", "1022", "ID expired");
  if (digit === 5) return buildResult("failed", `${label} not found in authority database`, jobId, smileType, clean, "Returned", "1013", "ID Number not found");
  if (digit === 7) return buildResult("failed", "Authority database temporarily unavailable — retry later", jobId, smileType, clean, "Not Applicable", "1015", "Authority down");
  return buildResult("error", "Smile ID service simulated error", jobId, smileType, clean, "Error", "2204", "Service error");
}

async function liveCheck(smileType: string, idNumber: string, fullName: string, cfg: SmileIdConfig): Promise<SmileIdResult> {
  if (!cfg.partner_id || !cfg.api_key) {
    return { status: "error", summary: "Smile ID live credentials not configured", reference: null, response: null };
  }
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts[1] ?? first;
  const timestamp = new Date().toISOString().replace(/\.\d+Z$/, ".000Z");
  const signature = generateSignature(timestamp, cfg.partner_id, cfg.api_key);
  const payload = {
    source_sdk: "rest_api", source_sdk_version: "1.0.0",
    signature, timestamp, partner_id: cfg.partner_id,
    partner_params: {
      job_id: `quickhire-${Math.random().toString(16).slice(2, 14)}`,
      user_id: `provider-${Math.random().toString(16).slice(2, 10)}`,
      job_type: 5,
    },
    country: "GH", id_type: smileType, id_number: idNumber.trim(),
    first_name: first, last_name: last,
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(LIVE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const raw = await res.text();
    if (!res.ok) return { status: "error", summary: `Smile ID returned HTTP ${res.status}`, reference: null, response: raw };
    const data = JSON.parse(raw);
    const approved = ["1012", "1020", "0810", "0811", "0820"].includes(data.ResultCode ?? "");
    const label = ID_TYPE_LABELS[smileType] ?? smileType;
    return {
      status: approved ? "verified" : "failed",
      summary: `${label} — ${data.ResultText ?? "No result text"}`,
      reference: data.SmileJobID ?? null,
      response: raw,
    };
  } catch (e: any) {
    clearTimeout(timer);
    return { status: "error", summary: `Smile ID error: ${e.message ?? "Unknown"}`, reference: null, response: null };
  }
}

export async function smileIdVerifyId(idType: string, idNumber: string, fullName: string): Promise<SmileIdResult> {
  const cfg = await getSmileIdConfig();

  if (!cfg.enabled || cfg.enabled === "0") {
    const r: SmileIdResult = { status: "error", summary: "Smile ID is currently disabled — manual review required", reference: null, response: null };
    await smileIdLog("verify_id", r.status, r.summary, undefined, { id_type: idType });
    return r;
  }

  const smileType = ID_TYPE_MAP[idType];
  if (!smileType) {
    const r: SmileIdResult = { status: "error", summary: `Unsupported ID type: ${idType}`, reference: null, response: null };
    await smileIdLog("verify_id", r.status, r.summary, undefined, { id_type: idType });
    return r;
  }

  const wallet = await prisma.partnerWallet.findFirst({ where: { partner: { slug: "smile_id" } } });
  const cost = wallet ? Number(wallet.costPerCheck) : 3.5;
  const txnId = await smileIdWalletCharge(cost, `pre-${Date.now().toString(16)}`, `Verification: ${idType.toUpperCase()}`);
  if (txnId === false) {
    const r: SmileIdResult = { status: "error", summary: "Smile ID wallet has insufficient balance — top up required", reference: null, response: null };
    await smileIdLog("verify_id", r.status, r.summary, undefined, { id_type: idType });
    return r;
  }

  const result = cfg.mode === "sandbox"
    ? sandboxCheck(smileType, idNumber)
    : await liveCheck(smileType, idNumber, fullName, cfg);

  if (typeof txnId === "number" && result.reference) {
    await prisma.partnerTransaction.update({ where: { id: txnId }, data: { reference: result.reference } }).catch(() => {});
  }

  await smileIdLog("verify_id", result.status, result.summary, result.reference ?? undefined, { id_type: idType, mode: cfg.mode });
  return result;
}

export function smileIdBadge(status: string) {
  if (status === "verified") return { bg: "#dcfce7", fg: "#166534", icon: "✓", label: "Smile ID Verified" };
  if (status === "failed")   return { bg: "#fee2e2", fg: "#991b1b", icon: "✗", label: "Smile ID Failed" };
  if (status === "error")    return { bg: "#e0e7ff", fg: "#3730a3", icon: "⚠", label: "Check Errored" };
  return { bg: "#f3f4f6", fg: "#374151", icon: "…", label: "Pending" };
}
