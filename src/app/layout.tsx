import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SessionRestore } from "@/components/SessionRestore";
import { ToastContainer } from "react-toastify";
import { GoogleAnalytics } from "@next/third-parties/google";
import "react-toastify/dist/ReactToastify.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: "500",
  style: "normal",
});

export const metadata: Metadata = {
  title: "Spotinet",
  description: "Tu servicio de streaming favorito",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={poppins.className}>
        <SessionRestore />
        <ToastContainer />
        {children}
        <GoogleAnalytics gaId="G-KMP3PXYE98" />
      </body>
    </html>
  );
}
