"use client";

import { Fade } from "react-awesome-reveal";
import React from "react";
import PacmanLoader from "react-spinners/PacmanLoader";

import { useState } from "react";

export default function ChangePassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerok, setAnswerok] = useState(false);

  async function sendData() {
    event?.preventDefault();

    setLoading(true);

    const data = {
      email: email,
      new_password: password,
    };

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_DISNEY + "/update_password",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnswerok(true);
        console.log(data);
      } else {
        console.log("Error en la petición");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-principal_blue h-screen w-full">
        <div className="text-center">
          <div className="flex justify-center">
            <PacmanLoader color="#00ffff" size={40} />
          </div>
          <p className="pt-4 font-semibold text-white">
            Estamos actualizando la contraseña, por favor espera unos segundos
          </p>
        </div>
      </div>
    );
  }

  return (
    <Fade triggerOnce cascade>
      <section className="flex items-center justify-center h-screen bg-principal_blue">
        <div className="text-center bg-principal_blue p-8 rounded-lg shadow-lg max-w-lg w-full">
          <h1 className="text-6xl md:text-7xl md:mb-10 mb-5 font-extrabold text-secondary_blue">
            Spotinet
          </h1>
          <p className="text-white text-xl md:mb-6 mb-5">
            Por favor digita el correo electrónico de la cuenta y la nueva
            contraseña
          </p>

          {answerok && (
            <p className="text-white text-xl my-4">Contraseña actualizada :D</p>
          )}

          <form className="space-y-4" onSubmit={sendData}>
            <input
              className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-4 py-2  w-full"
              type="email"
              placeholder="spotinet@spotinet.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="text"
              className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-4 py-2  w-full"
              required
              placeholder="nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="bg-secondary_blue text-white rounded-lg px-6 py-2 font-semibold hover:bg-secondary_blue-dark focus:outline-none focus:ring-4 focus:ring-secondary_blue focus:ring-opacity-50 transition duration-300 w-full"
              type="submit"
            >
              Enviar
            </button>

            <a
              href="/"
              className="block bg-secondary_blue text-white rounded-lg px-6 py-2 font-semibold text-center hover:bg-secondary_blue-dark focus:outline-none w-full"
            >
              Inicio
            </a>
          </form>
        </div>
      </section>
    </Fade>
  );
}
