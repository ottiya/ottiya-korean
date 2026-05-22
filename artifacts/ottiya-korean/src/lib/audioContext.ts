// Shared Web AudioContext helpers — used by EpisodePlayerPage, SongChallengePage, ChatPage.
//
// Why AudioContext instead of new Audio()?
// new Audio().play() is blocked by mobile autoplay policy when called from inside
// an async callback (e.g. TTS API response). AudioBufferSourceNode.start() is
// NOT subject to that restriction once the context is in "running" state.
// We unlock once on a genuine user gesture and re-resume before every play so
// iOS re-suspension (background, call, tab-switch) is handled automatically.

let _sharedAudioCtx: AudioContext | null = null;

export function getAudioCtx(): AudioContext {
  if (!_sharedAudioCtx || _sharedAudioCtx.state === "closed") {
    _sharedAudioCtx = new AudioContext();
  }
  return _sharedAudioCtx;
}

export function unlockAudioCtx(): void {
  const ctx = getAudioCtx();
  if (ctx.state !== "running") ctx.resume().catch(() => {});
}

// Decodes a base64 MP3 and plays it via the shared AudioContext.
// Returns a stop() function. Calls onEnded when playback finishes or errors.
// Always resumes the context before starting to handle iOS re-suspension.
export function playBase64Mp3(base64: string, onEnded: () => void): () => void {
  const ctx = getAudioCtx();
  let node: AudioBufferSourceNode | null = null;
  let stopped = false;

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const audioBuffer = bytes.buffer.slice(0);

  ctx.decodeAudioData(audioBuffer).then(async decoded => {
    if (stopped) return;
    if (ctx.state !== "running") {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
    if (stopped) return;
    node = ctx.createBufferSource();
    node.buffer = decoded;
    node.connect(ctx.destination);
    node.onended = () => { if (!stopped) onEnded(); };
    node.start();
  }).catch(() => { if (!stopped) onEnded(); });

  return () => {
    stopped = true;
    try { node?.stop(); } catch { /* already stopped */ }
    node = null;
  };
}
