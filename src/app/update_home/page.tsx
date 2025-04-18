"use client";

import { Fade } from "react-awesome-reveal";
import { FormEvent, useState } from "react";
import Image from "next/image";
import Loader from "../../components/Loader";
import { toast } from "react-toastify";

export default function UpdateHome() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<null | string>(null);

  async function sendData(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);

    const data = {
      email: email,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NETFLIX}/home_code/${data.email}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (
          data.link === "El link no fue solicitado en los últimos 20 minutos."
        ) {
          setResponseMessage(data.link);
          toast.warn(
            "No pediste el link en los últimos 20 min. ¡Solicítalo de nuevo! :)"
          );
        } else {
          setResponseMessage(data.link);
          toast.success("Gracias por preferirnos :D");
        }
      } else {
        toast.error("Algo salio mal, por favor verifica el correo 😄");
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
            Estamos trayendo el link para actualizar hogar, por favor espera
            unos segundos
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

            <div className="flex justify-center mb-4 gap-x-3">
              <Image src="/images/Net.svg" alt="Net" width={32} height={10} />
              <h2 className="text-secondary_blue text-2xl font-bold text-center mt-4">
                Actualizar Hogar
              </h2>
            </div>

            <hr />

            <p className="text-white text-md text-center mb-4 mt-5">
              Por favor digita el correo electrónico de la cuenta:
            </p>

            {responseMessage &&
              responseMessage !==
                "El link no fue solicitado en los últimos 20 minutos." && (
                <p className="text-white text-center text-md mb-4">
                  Haz click en el enlace para actualizar el hogar:{" "}
                  <a
                    className="text-secondary_blue underline"
                    rel="noreferrer"
                    target="_blank"
                    href={responseMessage}
                  >
                    Spotilink
                  </a>
                </p>
              )}

            <form className="space-y-4" onSubmit={sendData}>
              <input
                className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-lg px-2 py-2 w-full"
                type="email"
                placeholder="spotinet@spotinet.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <button
                className="bg-secondary_blue text-white rounded-xl px-6 py-2 font-semibold hover:bg-secondary_blue-dark focus:outline-none focus:ring-4 focus:ring-secondary_blue focus:ring-opacity-50 transition duration-300 w-full"
                type="submit"
              >
                Enviar
              </button>
            </form>
          </div>
        </section>
      </div>
    </Fade>
  );
}
