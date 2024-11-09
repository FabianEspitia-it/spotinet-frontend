import { Fade } from "react-awesome-reveal";
import Image from "next/image";

export default function Hero() {
  const links = [
    { label: "Actualiza Hogar", href: "/update_home", id: 1 },
    { label: "Código acceso temporal", href: "/temporal_access", id: 2 },
    {
      label: "Código de inicio de sesión",
      href: "/session_netflix_code",
      id: 5,
    },
    { label: "Código de inicio de sesión", href: "/session_code", id: 3 },
    // { label: "Cambio de contraseña", href: "/change_password", id: 4 },
  ];

  return (
    <section className="relative flex items-center pt-10 pb-20">
      <div className="mx-auto text-center">
        <Fade triggerOnce>
          <Image
            src="/images/spotinet_logo_two.png"
            alt="Spotinet Logo"
            width={320}
            height={320}
            className="mx-auto"
          />

          <p className="text-xl text-white mt-7">
            Por favor selecciona el servicio que deseas utilizar
          </p>
          <section className="flex flex-col items-center md:flex-row md:space-x-12 space-y-11 md:space-y-0 mt-9">
            {links.map((link, index) => (
              <a
                key={link.id}
                href={link.href}
                className={`rounded-lg text-white w-48 h-48 flex items-center justify-center shadow-md hover:shadow-lg
                ${
                  index < 3
                    ? "bg-netflix bg-cover bg-center bg-no-repeat"
                    : "bg-disney bg-cover bg-center bg-no-repeat"
                }
                border-2 border-gray-400 hover:border-secondary_blue duration-200 transition-all
              `}
                aria-label={link.label}
              >
                <span className="bg-black bg-opacity-50 px-4 py-2 rounded text-lg font-semibold tracking-wide">
                  {link.label}
                </span>
              </a>
            ))}
          </section>
        </Fade>
      </div>
    </section>
  );
}
