import type { PlayedNote } from "./model";
export type MidiSignal = {
  type: "on" | "off" | "pedal" | "reset";
  midi: number;
  velocity: number;
  time: number;
  channel: number;
  device: string;
  pedal?: boolean;
};
export class MidiProcessor {
  private held = new Map<string, PlayedNote[]>();
  private pedal = new Map<string, boolean>();
  constructor(
    private emit: (signal: MidiSignal, completed?: PlayedNote) => void,
  ) {}
  receive(data: ArrayLike<number>, time: number, device = "default") {
    if (data.length < 2) return;
    const type = data[0] & 0xf0,
      channel = data[0] & 0x0f;
    const midi = data[1],
      value = data[2] ?? 0;
    if (midi > 127 || value > 127) return;
    const key = `${device}:${channel}:${midi}`;
    if (type === 0x90 && value > 0) {
      const note: PlayedNote = {
        midi,
        start: time,
        velocity: value / 127,
        channel,
        device,
      };
      this.held.set(key, [...(this.held.get(key) || []), note]);
      this.emit({
        type: "on",
        midi,
        velocity: value / 127,
        time,
        channel,
        device,
      });
    } else if (type === 0x80 || (type === 0x90 && value === 0)) {
      const list = this.held.get(key) || [],
        note = list.shift();
      if (list.length) this.held.set(key, list);
      else this.held.delete(key);
      this.emit(
        { type: "off", midi, velocity: value / 127, time, channel, device },
        note ? { ...note, end: time } : undefined,
      );
    } else if (type === 0xb0 && midi === 64) {
      const down = value >= 64;
      this.pedal.set(`${device}:${channel}`, down);
      this.emit({
        type: "pedal",
        midi,
        velocity: value / 127,
        time,
        channel,
        device,
        pedal: down,
      });
    } else if (type === 0xb0 && (midi === 120 || midi === 123))
      this.reset(time, device, channel);
  }
  reset(time: number, device?: string, channel?: number) {
    for (const [key, list] of this.held) {
      if (
        (!device || list[0]?.device === device) &&
        (channel === undefined || list[0]?.channel === channel)
      ) {
        for (const note of list)
          this.emit(
            {
              type: "off",
              midi: note.midi,
              velocity: 0,
              time,
              channel: note.channel,
              device: note.device,
            },
            { ...note, end: time, incomplete: true },
          );
        this.held.delete(key);
      }
    }
    this.pedal.clear();
    this.emit({
      type: "reset",
      midi: 0,
      velocity: 0,
      time,
      channel: channel ?? 0,
      device: device || "all",
    });
  }
  get heldCount() {
    return [...this.held.values()].reduce((sum, list) => sum + list.length, 0);
  }
}
