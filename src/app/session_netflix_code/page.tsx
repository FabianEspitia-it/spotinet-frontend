"use client";

import { Fade } from "react-awesome-reveal";
import { FormEvent, useState } from "react";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";
import Image from "next/image";
import "react-toastify/dist/ReactToastify.css";

export default function SessionNetflixCode() {
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
        `${process.env.NEXT_PUBLIC_NETFLIX}/session_code/`,
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
        if (
          data.code === "El código no fue solicitado en los últimos 20 minutos."
        ) {
          toast.warn(
            "No pediste el código en los últimos 20 min. ¡Solicítalo de nuevo! :)"
          );
        } else {
          setResponseMessage(data.code);
          toast.success("Gracias por preferirnos 😄");
        }
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
            <Loader />
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
      <div className="relative min-h-screen">
        <Image
          src="/images/fondo_spotinet.webp"
          alt="Background"
          layout="fill"
          objectFit="cover"
          quality={100}
          className="z-0"
        />

        <div className="absolute inset-0 bg-black opacity-50"></div>

        <section className="relative z-10 flex items-center justify-center h-screen">
          <a href="/" className="absolute md:top-7 md:left-14 left-5 top-10">
            <Image
              src="/images/logo_spotinet.png"
              alt="Regresar al menú"
              width={60}
              height={60}
              className="w-10 h-10 md:w-14 md:h-14 cursor-pointer"
            />
          </a>

          {!responseMessage && (
            <div className="relative text-center bg-principal_blue border-2 border-secondary_blue rounded-lg px-8 pb-8 pt-6 max-w-lg w-full shadow-lg">
              <div className="flex items-center w-10 self-start -ml-5 mb-4">
                <a href="/" className="flex items-center">
                  <svg
                    className="size-6 text-secondary_blue mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <p className="text-secondary_blue">Inicio</p>
                </a>
              </div>

              {/* Logo y título */}
              <div className="flex justify-center items-center mb-6 gap-x-3">
                <Image src="/images/Net.svg" alt="Net" width={32} height={10} />
                <h2 className="text-secondary_blue text-xl font-bold lowercase">
                  código de inicio <br /> de sesión
                </h2>
              </div>

              <hr className="border-t-2 border-gray-400" />

              <p className="text-white text-sm mb-5 mt-6">
                Por favor digita el correo electrónico de la cuenta y la
                contraseña spotinet:
              </p>

              <form className="space-y-4" onSubmit={sendData}>
                <input
                  className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-4 py-2 w-full text-sm"
                  type="email"
                  placeholder="spotinet@spotinet.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                <input
                  type="password"
                  className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-4 py-2 w-full text-sm"
                  placeholder="Contraseña"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />

                <button
                  className="bg-secondary_blue text-white rounded-lg px-6 py-2 font-medium hover:bg-secondary_blue-dark focus:outline-none w-full text-sm"
                  type="submit"
                >
                  Enviar
                </button>
              </form>
            </div>
          )}

          {responseMessage && (
            <div className="relative text-center bg-principal_blue border-2 border-secondary_blue rounded-lg px-8 pb-8 pt-6 max-w-lg w-full shadow-lg">
              <div className="flex items-center w-10 self-start -ml-5 mb-4">
                <a href="/" className="flex items-center">
                  <svg
                    className="size-6 text-secondary_blue mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <p className="text-secondary_blue">Inicio</p>
                </a>
              </div>
              <div className="mb-5">
                <p className="text-white">Código de sesión: </p>
                <p className="text-secondary_blue text-xl">{responseMessage}</p>
              </div>

              <a
                className="bg-secondary_blue text-white rounded-xl px-6 py-2 font-semibold hover:bg-secondary_blue-dark focus:outline-none focus:ring-4 focus:ring-secondary_blue focus:ring-opacity-50 transition duration-300 w-full"
                href="/session_netflix_code"
              >
                Volver a solicitar
              </a>
            </div>
          )}
        </section>
      </div>
    </Fade>
  );
}
