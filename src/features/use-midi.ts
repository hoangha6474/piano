"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MidiProcessor, type MidiSignal } from "@/music/midi";
import type { PlayedNote } from "@/music/model";
export function useMidi(
  onSignal?: (signal: MidiSignal, completed?: PlayedNote) => void,
) {
  const [status, setStatus] = useState("Chưa kết nối"),
    [devices, setDevices] = useState<{ id: string; name: string }[]>([]),
    [selected, setSelected] = useState(""),
    [last, setLast] = useState<MidiSignal | null>(null),
    [pedal, setPedal] = useState(false);
  const access = useRef<MIDIAccess | null>(null),
    selectedRef = useRef(""),
    listener = useRef(onSignal);
  listener.current = onSignal;
  const processor = useRef<MidiProcessor | null>(null);
  if (!processor.current)
    processor.current = new MidiProcessor((signal, note) => {
      setLast(signal);
      if (signal.type === "pedal") setPedal(!!signal.pedal);
      if (signal.type === "reset") setPedal(false);
      listener.current?.(signal, note);
    });
  const attach = useCallback((id: string) => {
    processor.current!.reset(performance.now());
    selectedRef.current = id;
    setSelected(id);
    access.current?.inputs.forEach((input) => {
      input.onmidimessage =
        input.id === id
          ? (event) =>
              event.data &&
              processor.current!.receive(event.data, event.timeStamp, input.id)
          : null;
    });
    const input = access.current?.inputs.get(id);
    setStatus(input?.state === "connected" ? "Đã kết nối" : "Chưa có đàn");
  }, []);
  const connect = useCallback(async () => {
    if (!navigator.requestMIDIAccess) {
      setStatus(
        "Trình duyệt không hỗ trợ Web MIDI. Hãy thử Chrome hoặc Edge trên máy tính.",
      );
      return;
    }
    try {
      setStatus("Đang xin quyền MIDI…");
      access.current = await navigator.requestMIDIAccess({ sysex: false });
      const refresh = () => {
        const inputs = [...access.current!.inputs.values()].filter(
          (i) => i.state === "connected",
        );
        setDevices(
          inputs.map((i) => ({ id: i.id, name: i.name || "Thiết bị MIDI" })),
        );
        const preferred =
          inputs.find((i) => i.id === selectedRef.current) || inputs[0];
        if (preferred) {
          if (selectedRef.current !== preferred.id || !preferred.onmidimessage)
            attach(preferred.id);
          else setStatus("Đã kết nối");
        } else {
          processor.current!.reset(performance.now());
          setStatus(
            "Chưa có đàn — kiểm tra cáp USB hoặc kết nối MIDI trong hệ điều hành.",
          );
        }
      };
      access.current.onstatechange = refresh;
      refresh();
    } catch {
      setStatus(
        "Không được cấp quyền MIDI. Kiểm tra quyền của trang và kết nối an toàn.",
      );
    }
  }, [attach]);
  useEffect(
    () => () => {
      processor.current?.reset(performance.now());
      if (access.current) {
        access.current.onstatechange = null;
        access.current.inputs.forEach((i) => (i.onmidimessage = null));
      }
    },
    [],
  );
  return {
    status,
    devices,
    selected,
    select: attach,
    connect,
    last,
    pedal,
    connected: status === "Đã kết nối",
    reset: () => processor.current?.reset(performance.now()),
  };
}
