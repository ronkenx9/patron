import { sql } from "@vercel/postgres";

// The backend stores two things, and only two things: campaign proposals
// awaiting the owner's review, and signature-verified campaign updates.
// It never holds keys and never moves funds. Pledges live on-chain as
// public pool-to-treasury transfers; this store is not a supporter list.
export function hasDatabase(): boolean {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

export async function ensureSchema(): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS proposals (
    seq SERIAL PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    title TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS updates (
    seq SERIAL PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    author TEXT NOT NULL,
    body TEXT NOT NULL,
    posted_at BIGINT NOT NULL,
    signature JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
}

export type ProposalRow = {
  seq: number;
  campaign_id: string;
  title: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};

export async function insertProposal(campaignId: string, title: string, payload: Record<string, unknown>): Promise<ProposalRow> {
  await ensureSchema();
  const result = await sql`
    INSERT INTO proposals (campaign_id, title, payload)
    VALUES (${campaignId}, ${title}, ${JSON.stringify(payload)}::jsonb)
    RETURNING seq, campaign_id, title, payload, status, created_at`;
  return result.rows[0] as ProposalRow;
}

export async function listProposals(limit = 50): Promise<ProposalRow[]> {
  await ensureSchema();
  const result = await sql`SELECT seq, campaign_id, title, payload, status, created_at FROM proposals ORDER BY seq DESC LIMIT ${limit}`;
  return result.rows as ProposalRow[];
}

export type UpdateRow = {
  seq: number;
  campaign_id: string;
  author: string;
  body: string;
  posted_at: string;
  signature: unknown;
  created_at: string;
};

export async function insertUpdate(campaignId: string, author: string, body: string, postedAt: number, signature: unknown): Promise<UpdateRow> {
  await ensureSchema();
  const result = await sql`
    INSERT INTO updates (campaign_id, author, body, posted_at, signature)
    VALUES (${campaignId}, ${author}, ${body}, ${postedAt}, ${JSON.stringify(signature)}::jsonb)
    RETURNING seq, campaign_id, author, body, posted_at, signature, created_at`;
  return result.rows[0] as UpdateRow;
}

export async function listUpdates(campaignId: string, limit = 50): Promise<UpdateRow[]> {
  await ensureSchema();
  const result = await sql`SELECT seq, campaign_id, author, body, posted_at, signature, created_at FROM updates WHERE campaign_id = ${campaignId} ORDER BY seq DESC LIMIT ${limit}`;
  return result.rows as UpdateRow[];
}
