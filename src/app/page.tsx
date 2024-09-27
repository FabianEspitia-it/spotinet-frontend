"use client";

import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-principal_blue">
      <main className="flex flex-col justify-center items-center flex-1 px-8 max-w-screen-xl mx-auto">
        <Hero />
      </main>
    </div>
  );
}
