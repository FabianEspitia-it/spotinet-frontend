import { Fade } from "react-awesome-reveal";
import Image from "next/image";

export default function Hero() {
  const links = [
    { label: "Actualizar Hogar", href: "/update_home", id: 1 },
    { label: "Estoy de viaje", href: "/temporal_access", id: 2 },
    {
      label: "Código de inicio de sesión",
      href: "/session_netflix_code",
      id: 5,
    },
    {
      label: "Restablecimiento de contraseña",
      href: "/password_reset",
      id: 4,
    },
    { label: "Código de inicio de sesión", href: "/session_code", id: 3 },
  ];

  // add comment to deploy

  return (
    <section className="relative flex items-center pt-10 pb-20">
      <div className="mx-auto text-center pt-10">
        <Fade triggerOnce>
          <Image
            src="/images/final_logo.png"
            alt="Spotinet Logo"
            width={330}
            height={330}
            className="mx-auto"
          />

          <p className="text-lg text-white mt-10">
            Por favor selecciona el servicio que deseas utilizar:
          </p>
          <section className="flex flex-col items-center md:flex-row md:space-x-0 space-y-0 md:space-y-0 mt-3">
            {links.map((link, index) => (
              <a
                key={link.id}
                href={link.href}
                className={`text-white w-44 h-44 flex items-center justify-center shadow-md hover:shadow-lg
      ${
        index <= 3
          ? "bg-netflix bg-cover bg-center bg-no-repeat"
          : "bg-disney bg-cover bg-center bg-no-repeat"
      }
      border-2 border-secondary_blue duration-200 transition-all
      ${index === 0 ? "rounded-tl-2xl rounded-bl-2xl" : ""} 
      ${index === links.length - 1 ? "rounded-br-2xl rounded-tr-2xl" : ""}
    `}
                aria-label={link.label}
              >
                <span className="bg-black bg-opacity-50 px-2 py-1 rounded text-md font-semibold tracking-wide text-center flex flex-wrap justify-center">
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
