"use client";

import { useEffect, useState } from "react";
import { POOL_ADDRESS, makeProvider } from "@/lib/constants";
import { fromWei } from "@/lib/format";
import { readPoolFeeWei } from "@/lib/pool";

// All four cells are public chain state — no wallet, no consent, safe on the landing page.
export default function LiveStrip() {
  const [fee, setFee] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    readPoolFeeWei(makeProvider())
      .then((wei) => { if (live) setFee(fromWei(wei)); })
      .catch(() => { if (live) setFee("—"); });
    return () => { live = false; };
  }, []);

  return (
    <div className="strip">
      <span><i className="live-dot" aria-hidden /> LIVE</span>
      <span>NETWORK <b>SN_MAIN</b></span>
      <span>
        POOL{" "}
        <b>
          <a href={`https://voyager.online/contract/${POOL_ADDRESS}`} target="_blank" rel="noreferrer">
            0x0403…812a ↗
          </a>
        </b>
      </span>
      <span>POOL FEE <b>{fee ? `${fee} STRK` : "…"}</b></span>
    </div>
  );
}
