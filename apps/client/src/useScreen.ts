import { useCallback, useEffect, useRef, useState } from "react";
import { rank, type AppBar, type Block, type ScreenRequest } from "@moonshot/genui-core";
import { streamScreen } from "./api";

export interface ScreenState {
  appBar: AppBar | null;
  status: string | null;
  blocks: Block[];
  generating: boolean;
  generator: "claude" | "offline" | null;
  rejected: number;
  error: string | null;
  slow: boolean;
}

const empty: ScreenState = { appBar: null, status: null, blocks: [], generating: true, generator: null, rejected: 0, error: null, slow: false };

/** Inserts each streamed block into its grammar slot (blocks can arrive in any order). */
function insert(blocks: Block[], b: Block): Block[] {
  const r = rank(b);
  const i = blocks.findIndex((x) => rank(x) > r);
  return i < 0 ? [...blocks, b] : [...blocks.slice(0, i), b, ...blocks.slice(i)];
}

function useStream(req: ScreenRequest | null, nonce: number) {
  const [state, setState] = useState<ScreenState>(empty);
  const ctrl = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!req) return;
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState(empty);
    // gen/state/generating rule: after 20 s show "Still working".
    const slowTimer = setTimeout(() => setState((s) => (s.generating ? { ...s, slow: true } : s)), 20000);
    streamScreen(
      req,
      (e) =>
        setState((s) => {
          switch (e.type) {
            case "start": return { ...s, appBar: e.app_bar, generator: e.generator };
            case "status": return { ...s, status: e.text };
            case "block": return { ...s, blocks: insert(s.blocks, e.block) };
            case "rejected": return { ...s, rejected: s.rejected + 1 };
            case "done": return { ...s, generating: false, status: null };
            case "error": return { ...s, generating: false, error: e.message };
          }
        }),
      c.signal,
    ).finally(() => {
      clearTimeout(slowTimer);
      setState((s) => (s.generating && !c.signal.aborted ? { ...s, generating: false } : s));
    });
    return () => {
      clearTimeout(slowTimer);
      c.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.context, req?.subject_id, req?.viewer_id, req?.question, nonce]);
  const cancel = useCallback(() => {
    ctrl.current?.abort();
    setState((s) => ({ ...s, generating: false, status: null }));
  }, []);
  return { state, cancel };
}

/** A generated screen plus composer answers (answers render as insight blocks, not chat). */
export function useScreen(req: ScreenRequest) {
  const [nonce, setNonce] = useState(0);
  const [question, setQuestion] = useState<string | null>(null);
  const screen = useStream(req, nonce);
  const answer = useStream(question ? { ...req, question } : null, nonce);
  useEffect(() => setQuestion(null), [req.context, req.subject_id]);
  return {
    screen: screen.state,
    answer: question ? { question, ...answer.state } : null,
    ask: setQuestion,
    clearAnswer: () => setQuestion(null),
    regenerate: () => setNonce((n) => n + 1),
    cancel: () => { screen.cancel(); answer.cancel(); },
  };
}
