"use client";

import { useEffect, useState } from "react";
import { makeProvider } from "@/lib/constants";
import { fromWei } from "@/lib/format";
import { readPoolFeeWei } from "@/lib/pool";

// The fee is public pool state, so this read needs no wallet and no consent.
export default function FeeChip() {
  const [fee, setFee] = useState<string | null>(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    let live = true;
    readPoolFeeWei(makeProvider())
      .then((wei) => { if (live) setFee(fromWei(wei)); })
      .catch(() => { if (live) setDown(true); });
    return () => { live = false; };
  }, []);

  return (
    <p className="muted fee-chip">
      {fee ? <>Pool fee: <b>{fee} STRK</b> per private operation — your shielded balance must cover the amount plus this fee.</>
        : down ? <>Pool fee: unavailable right now. The wallet enforces it at signing anyway.</>
        : <>Pool fee: reading from the pool…</>}
    </p>
  );
}
