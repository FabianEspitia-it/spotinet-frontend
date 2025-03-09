import Image from "next/image";

export default function Hero() {
  const links = [
    { label: "Actualizar Hogar", href: "/update_home", img: "/images/Net.png" },
    {
      label: "Estoy de viaje",
      href: "/temporal_access",
      img: "/images/Net.png",
    },
    {
      label: "Código de inicio de sesión",
      href: "/session_netflix_code",
      img: "/images/Net.png",
    },
    {
      label: "Restablecimiento de contraseña",
      href: "/password_reset",
      img: "/images/Net.png",
    },
    {
      label: "Código de inicio de sesión",
      href: "/session_code",
      img: "/images/Dis.png",
    },
  ];

  return (
    <>
      <section className="relative flex items-center pt-10 pb-20">
        <div className="mx-auto text-center pt-10">
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

          <section className="flex flex-col items-center md:flex-row mt-3">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={`text-secondary_blue w-44 h-44 border-2 border-secondary_blue flex flex-col items-center justify-center 
      bg-principal_blue shadow-md hover:bg-secondary_blue hover:text-principal_blue duration-200 transition-all 
      ${
        index === 0
          ? "md:rounded-l-xl md:rounded-r-none rounded-t-xl"
          : index === links.length - 1
          ? "md:rounded-r-xl md:rounded-l-none  rounded-b-xl"
          : ""
      }`}
                aria-label={link.label}
              >
                <Image
                  src={link.img}
                  alt={link.label}
                  width={link.img === "/images/Net.png" ? 34 : 90}
                  height={10}
                />
                <span className="mt-2 text-md font-semibold text-center">
                  {link.label}
                </span>
              </a>
            ))}
          </section>
        </div>
      </section>
      <Image
        src="/images/Ayuda.png"
        alt="Pregunta"
        width={45}
        height={45}
        className="md:fixed md:bottom-6 md:right-6 md:mb-0 md:cursor-pointer mb-8"
      />
    </>
  );
}
