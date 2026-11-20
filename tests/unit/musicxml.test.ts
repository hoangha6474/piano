import { describe, expect, it } from "vitest";
import { readMusicXML } from "../../src/music/musicxml";
import { library } from "../../src/music/library";
import { toMusicXML } from "../../src/music/notation";
const note = (step = "C", extra = "", duration = 1) =>
  `<note>${extra}<pitch><step>${step}</step><octave>4</octave></pitch><duration>${duration}</duration><voice>1</voice></note>`;
const xml = (body: string) =>
  `<score-partwise><work><work-title>A &amp; B</work-title></work><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>${body}</measure></part></score-partwise>`;
describe("admin MusicXML parsing", () => {
  it("reads generated system scores with correct hands and timing", () => {
    for (const source of library) {
      const parsed = readMusicXML(toMusicXML(source), source.id);
      expect(
        parsed.notes.map((n) => [n.midi, n.beat, n.duration, n.hand]),
      ).toEqual(
        source.notes
          .slice()
          .sort((a, b) =>
            a.hand === b.hand
              ? a.beat - b.beat || a.midi - b.midi
              : a.hand === "right"
                ? -1
                : 1,
          )
          .map((n) => [n.midi, n.beat, n.duration, n.hand]),
      );
    }
  });
  it("preserves chords, backup, rests and staff assignment", () => {
    const score = readMusicXML(
      xml(
        `${note()}${note("E", "<chord/>")}<backup><duration>1</duration></backup>${note("G", "<staff>2</staff>")}<note><rest/><duration>1</duration></note>${note("D")}`,
      ),
      "test",
    );
    expect(score.title).toBe("A & B");
    expect(score.notes.map((n) => [n.midi, n.beat, n.hand])).toEqual([
      [60, 0, "right"],
      [64, 0, "right"],
      [67, 0, "left"],
      [62, 2, "right"],
    ]);
  });
  it("merges ties within the same voice only", () => {
    const tied = readMusicXML(
      xml(note("C", '<tie type="start"/>') + note("C", '<tie type="stop"/>')),
      "test",
    );
    expect(tied.notes).toHaveLength(1);
    expect(tied.notes[0].duration).toBe(2);
    expect(() =>
      readMusicXML(
        xml(
          note("C", '<tie type="start"/>') +
            note("C", '<tie type="stop"/>').replace(
              "<voice>1</voice>",
              "<voice>2</voice>",
            ),
        ),
        "test",
      ),
    ).toThrow("Dấu nối");
  });
  it("strips exported external DTD declarations without resolving them", () => {
    const parsed = readMusicXML(
      '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "https://www.musicxml.org/dtds/partwise.dtd">' +
        xml(note()),
      "test",
    );
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.xml).not.toContain("DOCTYPE");
  });
  it.each([
    '<!DOCTYPE score-partwise [<!ENTITY x "secret">]>' + xml(note()),
    xml(note()).replace("<step>C</step>", "<step>H</step>"),
    xml(note("C", "", 0)),
    xml("<backup><duration>1</duration></backup>" + note()),
    xml(note("C", "<grace/>")),
    xml(note() + '<barline><repeat direction="backward"/></barline>'),
    xml(note()).replace("<divisions>1</divisions>", "<divisions>0</divisions>"),
    xml("<note><rest/><duration>4</duration></note>"),
    "<score-timewise/>",
  ])("rejects unsupported or invalid XML", (input) => {
    expect(() => readMusicXML(input, "test")).toThrow();
  });
});
