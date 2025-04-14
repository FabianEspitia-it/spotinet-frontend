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
          setResponseMessage(
            "El código no fue solicitado en los últimos 20 minutos."
          );

          toast.warn(
            "El código no fue solicitado en los últimos 20 minutos. Por favor solicita el código :D"
          );
        } else {
          setResponseMessage(`Código de sesión: ${data.code}`);
          toast.success("Gracias por preferirnos :D");
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
          src="/images/fondo_spotinet-min.webp"
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

          <div className="text-center bg-principal_blue border-2 border-secondary_blue rounded-lg px-8 pb-10 pt-4 max-w-lg w-full shadow-lg">
            <div className="flex justify-center mb-4 gap-x-3">
              <Image src="/images/Net.png" alt="Net" width={32} height={10} />
              <h2 className="text-secondary_blue text-2xl font-bold text-center mt-4">
                Código de inicio de sesión
              </h2>
            </div>

            <hr />

            <p className="text-white text-md md:mb-6 mb-5 mt-5">
              Por favor digita el correo electrónico de la cuenta y la
              contraseña spotinet:
            </p>

            {responseMessage && (
              <p className="text-secondary_blue text-md my-4">
                {responseMessage}
              </p>
            )}

            <form className="space-y-4" onSubmit={sendData}>
              <input
                className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-xl px-2 py-2 w-full"
                type="email"
                placeholder="spotinet@spotinet.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <input
                type="password"
                className="border-2 border-secondary_blue focus:outline-none bg-white text-gray-800 rounded-xl px-2 py-2 w-full"
                placeholder="Contraseña"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
