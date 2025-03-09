"use client";

import Hero from "@/components/Hero";
import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Image
        src="/images/fondo_spotinet-min.webp"
        alt="Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="z-0"
      />

      <main className="relative z-10 flex flex-col justify-center items-center flex-1 px-8 max-w-screen-xl mx-auto">
        <Hero />
      </main>
    </div>
  );
}
