"use client";

import { Fade } from "react-awesome-reveal";

export default function SessionCode() {
  return (
    <Fade triggerOnce cascade>
      <section className="flex items-center justify-center h-screen bg-principal_blue">
        <div className="text-center bg-principal_blue px-8 rounded-lg shadow-lg max-w-lg w-full">
          <h1 className="text-6xl md:text-7xl md:mb-10 font-extrabold text-secondary_blue">
            Spotinet
          </h1>
          <p className="text-white text-xl md:mb-6">
            Por favor digita el correo electrónico de la cuenta
          </p>

          <form className="space-y-4" action="">
            <input
              className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-4 py-2 w-full"
              type="email"
              placeholder="spotinet@spotinet.com"
              required
            />

            <button
              className="bg-secondary_blue text-white rounded-lg px-6 py-2 font-semibold hover:bg-secondary_blue-dark focus:outline-none focus:ring-4 focus:ring-secondary_blue focus:ring-opacity-50 transition duration-300 w-full"
              type="submit"
            >
              Enviar
            </button>

            <a
              href="/"
              className="block bg-secondary_blue text-white rounded-lg px-6 py-2 font-semibold text-center hover:bg-secondary_blue-dark focus:outline-none focus:ring-4 focus:ring-secondary_blue focus:ring-opacity-50 transition duration-300 w-full"
            >
              Inicio
            </a>
          </form>
        </div>
      </section>
    </Fade>
  );
}
