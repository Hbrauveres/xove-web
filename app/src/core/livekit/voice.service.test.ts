import { act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_VOICE } from "@core/preferences/preferences.constants";
import { FakeLocalMicTrack, lastRoom } from "../../test/fakeLiveKit";
import { connectedAdapter } from "../../test/factories/video-room.factory";
import type { LiveKitAdapter } from "./livekit.adapter";
import { NoiseGate } from "./noise-gate.adapter";

const connected = connectedAdapter;

describe("my voice", () => {
  const VOICE = { ...DEFAULT_VOICE, micId: "mic-2", sensitivity: 0.2 };

  async function start(adapter: LiveKitAdapter, prefs = VOICE) {
    return adapter.startVoice(prefs);
  }

  it("asks for the picked mic with its processing, and sends it as my microphone", async () => {
    const adapter = await connected();
    expect(await start(adapter)).toBeNull();

    const local = lastRoom().localParticipant;
    expect(local.createTracks).toHaveBeenLastCalledWith({
      audio: {
        deviceId: { ideal: "mic-2" },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        voiceIsolation: false,
      },
    });
    expect(local.mic?.options).toEqual({ source: "microphone" });
    await waitFor(() => expect(adapter.getState().voice).toBe(true));
    expect(adapter.getState().micInput).toBe(local.mic!.track.mediaStreamTrack);
  });

  it("says why when the browser blocks the mic or there's none, and sends nothing", async () => {
    const adapter = await connected();
    lastRoom().localParticipant.nextMic = "NotAllowedError";
    expect(await start(adapter)).toBe("blocked");
    lastRoom().localParticipant.nextMic = "NotFoundError";
    expect(await start(adapter)).toBe("missing");
    expect(lastRoom().localParticipant.mic).toBeNull();
    expect(adapter.getState().voice).toBe(false);
  });

  it("applies another mic or other processing to the same track, live", async () => {
    const adapter = await connected();
    await start(adapter);
    const track = lastRoom().localParticipant.mic!.track;
    await act(async () => {
      await adapter.applyVoice({ ...VOICE, micId: "mic-1", echoCancellation: false });
    });
    expect(track.restartTrack).toHaveBeenLastCalledWith(
      expect.objectContaining({ deviceId: { ideal: "mic-1" }, echoCancellation: false }),
    );
    expect(lastRoom().localParticipant.mic!.track).toBe(track);
  });

  it("stops sending my voice", async () => {
    const adapter = await connected();
    await start(adapter);
    await act(async () => {
      await adapter.stopVoice();
    });
    expect(lastRoom().localParticipant.mic).toBeNull();
    await waitFor(() => expect(adapter.getState().voice).toBe(false));
    expect(adapter.getState().micInput).toBeUndefined();
  });

  it("sends it through the noise gate at my sensitivity, and moves the line live", async () => {
    const close = vi.fn(async () => {});
    vi.stubGlobal(
      "AudioContext",
      class {
        close = close;
      },
    );
    const adapter = await connected();
    await start(adapter);

    const track = lastRoom().localParticipant.mic!.track as FakeLocalMicTrack;
    expect(track.setAudioContext).toHaveBeenCalledTimes(1);
    const gate = track.processor as NoiseGate;
    expect(gate).toBeInstanceOf(NoiseGate);
    expect((gate as unknown as { line: number }).line).toBe(0.2);
    act(() => adapter.setVoiceLine(0.5));
    expect((gate as unknown as { line: number }).line).toBe(0.5);

    await act(async () => {
      await adapter.stopVoice();
    });
    expect(close).toHaveBeenCalled();
  });

  it("stops the mic at once when it can't be sent, and says so apart from a block", async () => {
    const close = vi.fn(async () => {});
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        close = close;
      },
    );
    const adapter = await connected();
    const local = lastRoom().localParticipant;
    let captured: FakeLocalMicTrack | undefined;
    local.createTracks.mockImplementationOnce(async (options?: { audio?: unknown }) => [
      (captured = new FakeLocalMicTrack(options?.audio)),
    ]);
    local.publishTrack.mockRejectedValueOnce(new Error("not allowed to publish"));

    expect(await start(adapter)).toBe("failed");
    expect(captured!.stopped).toBe(true);
    expect(close).toHaveBeenCalled();
    expect(local.mic).toBeNull();
    expect(adapter.getState().voice).toBe(false);
  });

  it("wakes the gate's audio when the browser started it suspended (after the permission prompt)", async () => {
    const resume = vi.fn(async () => {});
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "suspended";
        resume = resume;
        close = async () => {};
      },
    );
    const adapter = await connected();
    await start(adapter);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it("sends it ungated where the browser has no Web Audio", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const adapter = await connected();
    expect(await start(adapter)).toBeNull();
    expect((lastRoom().localParticipant.mic!.track as FakeLocalMicTrack).setProcessor).not.toHaveBeenCalled();
    expect(lastRoom().localParticipant.mic).not.toBeNull();
  });
});
