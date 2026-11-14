/** Whether this browser can isolate a voice (only recent Chrome can): a question to its devices. */
export function canIsolateVoice(): boolean {
  try {
    return Reflect.get(navigator.mediaDevices?.getSupportedConstraints?.() ?? {}, "voiceIsolation") === true;
  } catch {
    return false;
  }
}
