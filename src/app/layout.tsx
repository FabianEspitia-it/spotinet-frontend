import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
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
  description: "somos lo mejor",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="bg-principal_blue">
      <body className={poppins.className}>
        <ToastContainer />

        {children}
      </body>
      <GoogleAnalytics gaId="G-KMP3PXYE98" />
    </html>
  );
}
