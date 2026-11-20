import type { Metadata } from "next";
import "./globals.css";
import { SystemLibraryProvider } from "@/features/system-library";
export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  title: "Piano Learning — Học theo nhịp của bạn",
  description:
    "Học Piano trên đàn thật. Giáo trình tiếng Việt, bản nhạc tương tác và luyện tập qua MIDI.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <SystemLibraryProvider>{children}</SystemLibraryProvider>
      </body>
    </html>
  );
}
