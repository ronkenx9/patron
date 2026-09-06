"use client";

import { useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import ConnectButton from "@/components/ConnectButton";
import { makeProvider } from "@/lib/constants";
import { checkProposal, loadDraft, proposalSnippet, saveDraft, type CampaignProposal } from "@/lib/proposal";
import { useWallet } from "@/store/wallet";

const EMPTY = {
  title: "",
  blurb: "",
  story: "",
  goal: "250",
  deadline: "",
  beneficiary: "",
  fromBlock: "",
};

type FormState = typeof EMPTY;

export default function SubmitPage() {
  const { address, connected } = useWallet();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [head, setHead] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [queued, setQueued] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitNote, setSubmitNote] = useState("");

  useEffect(() => {
    const draft = loadDraft<FormState>();
    if (draft) setForm((current) => ({ ...current, ...draft, beneficiary: draft.beneficiary || current.beneficiary }));
    setForm((current) => ({ ...current, deadline: current.deadline || new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10) }));
  }, []);

  useEffect(() => {
    if (connected && address) setForm((current) => ({ ...current, beneficiary: current.beneficiary || address }));
  }, [connected, address]);

  useEffect(() => {
    let live = true;
    makeProvider().getBlockNumber().then((block) => { if (live) setHead(block); }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    saveDraft(form);
  }, [form]);

  const result = useMemo(() => checkProposal({ ...form, fromBlock: form.fromBlock || String(head ?? "") }), [form, head]);
  const proposal: CampaignProposal | null = result.ok ? result.proposal : null;
  const snippet = proposal ? proposalSnippet(proposal) : "";

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function copy() {
    if (!snippet) return;
    try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  }

  async function submitForReview() {
    if (!proposal) return;
    setSubmitting(true); setSubmitNote("");
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: proposal.title,
          blurb: proposal.blurb,
          story: proposal.story.join("\n"),
          goal: String(Number(form.goal)),
          deadline: proposal.deadline,
          beneficiary: proposal.beneficiary,
          fromBlock: proposal.fromBlock,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 201) {
        setQueued(true);
      } else if (response.status === 503) {
        setSubmitNote("The review queue is offline on this deployment — use copy/download and open the PR directly.");
      } else {
        setSubmitNote(data.error ?? "Submission failed — use copy/download instead.");
      }
    } catch {
      setSubmitNote("Network error — use copy/download instead.");
    } finally {
      setSubmitting(false);
    }
  }

  function download() {
    if (!proposal) return;
    const blob = new Blob([JSON.stringify({ ...proposal, goalWei: proposal.goalWei.toString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${proposal.id}.campaign.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Shell>
      <div className="appgrid">
        <section className="panel">
          <p className="eyebrow">PROPOSE / IDEA CAMPAIGN</p>
          <h2 style={{ marginTop: 14 }}>Pitch a campaign.</h2>
          <p className="section-copy">
            There is no backend and no custody: a campaign goes live when its config lands in this repo through a
            reviewable pull request. Fill this in, take the generated config, and open a PR — the owner reviews every
            treasury before real STRK can move.
          </p>
          <div className="stack" style={{ marginTop: 24 }}>
            <label>Campaign title
              <input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="SEASON 03 — docs & audits" />
            </label>
            <label>One-liner
              <input value={form.blurb} onChange={(event) => set("blurb", event.target.value)} placeholder="Three months of privacy docs, on the house." />
            </label>
            <label>Story — one paragraph per line
              <textarea rows={5} value={form.story} onChange={(event) => set("story", event.target.value)} placeholder={"What the money is for.\nMilestones, so backers can hold you to it."} />
            </label>
            <div className="form-grid">
              <label>Goal (STRK)
                <input value={form.goal} onChange={(event) => set("goal", event.target.value)} inputMode="decimal" />
              </label>
              <label>Deadline
                <input type="date" value={form.deadline} onChange={(event) => set("deadline", event.target.value)} />
              </label>
            </div>
            <label>Treasury address — receives the STRK
              <input value={form.beneficiary} onChange={(event) => set("beneficiary", event.target.value)} placeholder={connected ? shortSelf(address) : "0x…  (connect your wallet to prefill)"} spellCheck={false} />
            </label>
            <div className="form-grid">
              <label>Counting starts at block
                <input value={form.fromBlock} onChange={(event) => set("fromBlock", event.target.value)} placeholder={head ? String(head) : "current head"} inputMode="numeric" />
              </label>
              <div className="stack" style={{ gap: 6, alignSelf: "end" }}>
                <p className="fineprint">HEAD {head ? `#${head}` : "…"}</p>
                {!form.fromBlock && head ? <button className="chip" onClick={() => set("fromBlock", String(head))}>use current head</button> : null}
              </div>
            </div>
            {!connected ? (
              <div className="stack" style={{ gap: 8 }}>
                <ConnectButton />
                <p className="fineprint">Connect to prefill your treasury — your wallet is the account here.</p>
              </div>
            ) : null}
            {!result.ok ? <p className="error">{result.reason}</p> : (
              <div className="quickrow">
                <button className="btn btn-solid" disabled={submitting || queued} onClick={submitForReview}>{queued ? "Queued ✓" : submitting ? "Submitting…" : "Submit for review"}</button>
                <button className="btn" onClick={download} disabled={!proposal}>Download config</button>
              </div>
            )}
            {queued ? <p className="receipt"><b>In the review queue.</b><br />The owner reads the queue at the next review pass. Your draft also stays in this browser; the config below is always yours to keep.</p> : null}
            {submitNote ? <p className="error">{submitNote}</p> : null}
          </div>
        </section>

        <aside className="rail">
          <div className="railcard">
            <h4>Generated config</h4>
            {snippet ? (
              <>
                <pre className="proposal-pre">{snippet}</pre>
                <div className="quickrow" style={{ marginTop: 12 }}>
                  <button className="chip" onClick={copy}>{copied ? "copied ✓" : "copy config"}</button>
                  <button className="chip" onClick={download}>download .json</button>
                </div>
              </>
            ) : (
              <p className="fineprint">Fill the form — the config appears here, ready to paste into a pull request.</p>
            )}
          </div>
          <div className="railcard">
            <h4>What happens next</h4>
            <ul className="checklist">
              <li>Open a PR adding your config to `CAMPAIGNS` in src/lib/campaigns.ts.</li>
              <li>The owner reviews the treasury and the story — no custody, so review matters.</li>
              <li>Merge flips your page from PREVIEW to LIVE; pledges start counting from your block.</li>
              <li>Drafts autosave in this browser only — nothing is sent anywhere.</li>
            </ul>
          </div>
          <div className="railcard">
            <h4>A profile without login</h4>
            <p className="fineprint">
              Your wallet is the account. Connecting prefills the treasury; the <a href="/profile" style={{ textDecoration: "underline" }}>account page</a> shows earnings for any treasury you own — derived from public pledge events.
            </p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function shortSelf(address?: string): string {
  return address ? `${address.slice(0, 10)}…${address.slice(-6)}` : "0x…";
}
