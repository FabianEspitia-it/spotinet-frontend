"use client";

import { Fade } from "react-awesome-reveal";
import { FormEvent, useState } from "react";
import PacmanLoader from "react-spinners/PacmanLoader";
import { toast } from "react-toastify";
import Image from "next/image";

export default function SessionCode() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  async function sendData(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setResponseMessage("");

    const data = {
      email: email,
      password: password,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DISNEY}/session_code/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResponseMessage(`Código de sesión: ${data.code}`);
        toast.success("Gracias por preferirnos :D");
      } else {
        toast.error(
          "Algo salio mal, por favor verifica el correo y la contraseña"
        );
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
            Estamos trayendo el código, por favor espera unos segundos
          </p>
        </div>
      </div>
    );
  }

  return (
    <Fade triggerOnce cascade>
      <section className="flex items-center justify-center h-screen bg-principal_blue">
        <div className="text-center bg-principal_blue px-8 max-w-lg w-full">
          <Image
            src="/images/spotinet_logo_two.png"
            alt="Spotinet Logo"
            width={320}
            height={320}
            className="mx-auto mb-5"
          />
          <p className="text-white text-xl md:mb-6 mb-5">
            Por favor digita el correo electrónico de la cuenta y la contraseña
            spotinet
          </p>

          {responseMessage && (
            <p className="text-white text-xl my-4">{responseMessage}</p>
          )}

          <form className="space-y-4" action="" onSubmit={sendData}>
            <input
              className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-4 py-2 w-full"
              type="email"
              placeholder="spotinet@spotinet.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <input
              type="password"
              className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-4 py-2 w-full"
              placeholder="contraseña"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
