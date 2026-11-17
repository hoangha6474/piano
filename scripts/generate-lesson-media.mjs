import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
const target = resolve("public/lessons"),
  frames = resolve(".lesson-media-work");
await mkdir(target, { recursive: true });
await mkdir(frames, { recursive: true });
const labels = ["Ngón cái", "Ngón trỏ", "Ngón giữa", "Ngón áp út", "Ngón út"];
for (let focus = 0; focus < 5; focus++) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" rx="22" fill="#f3f5ec"/><text x="65" y="65" fill="#8a9777" font-family="Arial" font-size="13" letter-spacing="4">PIANO LEARNING · MINH HỌA</text><text x="65" y="117" fill="#38482d" font-family="Arial" font-size="30">Năm ngón tay, một khởi đầu</text><text x="65" y="158" fill="#82926e" font-family="Arial" font-size="17">Số ngón giống nhau ở cả hai tay.</text><rect x="290" y="318" width="310" height="115" rx="40" fill="#e2e9d4" stroke="#bbc9a4" stroke-width="2"/>${[
    0, 1, 2, 3, 4,
  ]
    .map((n) => {
      const heights = [80, 135, 160, 130, 90],
        x = 292 + n * 60,
        y = 340 - heights[n] - (n === focus ? 12 : 0);
      return `<rect x="${x}" y="${y}" width="52" height="${heights[n] + 15}" rx="25" fill="${n === focus ? "#829665" : "#dce6cc"}" stroke="#b6c69e" stroke-width="2"/><text x="${x + 26}" y="${y + 40}" text-anchor="middle" fill="${n === focus ? "#fff" : "#6e8353"}" font-family="Arial" font-size="22">${n + 1}</text>`;
    })
    .join(
      "",
    )}<text x="690" y="270" text-anchor="middle" fill="#738755" font-family="Arial" font-size="72">${focus + 1}</text><text x="690" y="312" text-anchor="middle" fill="#768665" font-family="Arial" font-size="21">${labels[focus]}</text><text x="65" y="485" fill="#7f8f6b" font-family="Arial" font-size="16">Thả lỏng cổ tay. Giữ khớp ngón tự nhiên, chuyển động nhẹ nhàng.</text><text x="65" y="515" fill="#a3ad94" font-family="Arial" font-size="11">Sơ đồ minh họa số ngón; không phải đo ngón tay thực tế qua MIDI.</text></svg>`;
  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(frames, `finger-${focus}.png`));
  if (focus === 0) {
    await writeFile(join(target, "finger-guide.svg"), svg);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(join(target, "finger-guide.png"));
  }
}
const sequence = [0, 1, 2, 3, 4, 3, 2, 1, 0],
  manifest =
    sequence
      .map(
        (i) =>
          `file '${join(frames, `finger-${i}.png`).replaceAll("\\", "/")}'\nduration 0.8`,
      )
      .join("\n") +
    `\nfile '${join(frames, "finger-0.png").replaceAll("\\", "/")}'\n`;
await writeFile(join(frames, "frames.txt"), manifest);
const result = spawnSync(
  ffmpeg.path,
  [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    join(frames, "frames.txt"),
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "36",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "24",
    join(target, "five-fingers.webm"),
  ],
  { stdio: "pipe", windowsHide: true },
);
if (result.status !== 0) throw new Error(result.stderr.toString().slice(-2000));
console.log("Created original finger illustration and WebM lesson video.");
