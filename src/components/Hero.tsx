import { Fade } from "react-awesome-reveal";

export default function Hero() {
  const links = [
    { label: "Actualiza Hogar", href: "/update_home", id: 1 },
    { label: "Código acceso temporal", href: "/temporal_access", id: 2 },
    {
      label: "Código de inicio de sesión",
      href: "/session_netflix_code",
      id: 5,
    },
    { label: "Código inicio de sesión", href: "/session_code", id: 3 },
    { label: "Cambio de contraseña", href: "/change_password", id: 4 },
  ];

  return (
    <section className="relative flex items-center pt-16 pb-20">
      <Fade triggerOnce cascade>
        <div className="mx-auto text-center">
          <h1 className="text-6xl md:text-7xl md:mb-4 font-extrabold text-secondary_blue">
            Spotinet
          </h1>

          <p className="text-xl text-white mt-10">
            Por favor selecciona el servicio que deseas utilizar
          </p>
          <section className="flex flex-col items-center md:flex-row md:space-x-12 space-y-11 md:space-y-0 mt-14">
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
        </div>
      </Fade>
    </section>
  );
}
