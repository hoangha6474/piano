import { describe, it, expect } from "vitest";
import { toMusicXML } from "../../src/music/notation";
import { library } from "../../src/music/library";
describe("generated MusicXML", () => {
  it("includes all notes including the first measure and escapes metadata", () => {
    const s = library[0],
      xml = toMusicXML({ ...s, title: "A&B <test>" });
    expect((xml.match(/<pitch>/g) || []).length).toBe(16);
    expect(xml).toContain("A&amp;B &lt;test&gt;");
    expect(xml).toContain('id="right-0"');
  });
  it("engraves dotted durations explicitly and splits irregular rests", () => {
    const xml = toMusicXML({
      ...library[0],
      notes: [{ id: "one", midi: 60, beat: 0, duration: 1.5, hand: "right" }],
    });
    expect(xml).toContain("<type>quarter</type><dot/>");
    expect(xml).toContain("<duration>960</duration><type>half</type>");
    expect(xml).toContain("<duration>240</duration><type>eighth</type>");
  });
  it("rejects durations it cannot engrave faithfully", () => {
    expect(() =>
      toMusicXML({
        ...library[0],
        notes: [
          { id: "one", midi: 60, beat: 0, duration: 1.25, hand: "right" },
        ],
      }),
    ).toThrow("MusicXML");
  });
});
