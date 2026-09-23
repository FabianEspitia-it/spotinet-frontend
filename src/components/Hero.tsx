import Image from "next/image";
import LogoutButton from "./LogoutButton";

export default function Hero() {
  const links = [
    {
      label: "Actualizar hogar o Estoy de viaje",
      href: "/home_or_temporal",
      img: "/images/Net.svg",
      imgHover: "/images/Net2.svg",
    },
    {
      label: "Código para cerrar dispositivos",
      href: "/netflix_verification_code",
      img: "/images/Net.svg",
      imgHover: "/images/Net2.svg",
    },
    {
      label: "Código de inicio de sesión",
      href: "/session_netflix_code",
      img: "/images/Net.svg",
      imgHover: "/images/Net2.svg",
    },
    {
      label: "Restablecimiento de contraseña",
      href: "/password_reset",
      img: "/images/Net.svg",
      imgHover: "/images/Net2.svg",
    },
    {
      label: "Código de inicio de sesión",
      href: "/session_code",
      img: "/images/Dis.svg",
      imgHover: "/images/Dis2.svg",
    },
    {
      label: "Código de inicio de sesión",
      href: "/amazon_code",
      img: "/images/Prime.svg",
      imgHover: "/images/Prime2.svg",
    },

    {
      label: "Código de inicio de sesión",
      href: "/hbo_session_code",
      img: "/images/Hbo.svg",
      imgHover: "/images/Hbo.svg",
    },

    {
      label: "Código de inicio de sesión",
      href: "/spotify_session_code",
      img: "/images/Spotify.svg",
      imgHover: "/images/Spotify2.svg",
    },
  ];

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-30 sm:right-8 sm:top-6">
        <div className="pointer-events-auto">
          <LogoutButton />
        </div>
      </div>

      <section className="relative flex w-full items-center pb-20 pt-10">
        <div className="mx-auto w-full pt-10 text-center">
          <Image
            src="/images/final_logo.svg"
            alt="Spotinet Logo"
            width={330}
            height={330}
            className="mx-auto"
          />

          <p className="mt-6 text-lg text-white">
            Por favor selecciona el servicio que deseas utilizar:
          </p>

          <section className="mx-auto mt-3 grid w-full max-w-[1408px] grid-cols-1 gap-[2px] overflow-hidden rounded-xl border-2 border-secondary_blue bg-secondary_blue shadow-md sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="group text-secondary_blue w-full h-44 flex flex-col items-center justify-center 
        bg-principal_blue hover:bg-secondary_blue hover:text-principal_blue duration-200 transition-all"
                aria-label={link.label}
              >
                <div className="relative">
                  {/* Imagen por defecto */}
                  <Image
                    src={link.img}
                    alt={link.label}
                    width={
                      link.img.includes("Net")
                        ? 34
                        : link.img.includes("Dis")
                          ? 100
                          : link.img.includes("Prime")
                            ? 70
                            : link.img.includes("Spotify")
                              ? 44
                              : 70
                    }
                    height={10}
                    className="group-hover:opacity-0 transition-opacity duration-300"
                  />

                  {/* Imagen en hover */}
                  <Image
                    src={link.imgHover}
                    alt={`${link.label} hover`}
                    width={
                      link.img.includes("Net")
                        ? 34
                        : link.img.includes("Dis")
                          ? 100
                          : link.img.includes("Prime")
                            ? 70
                            : link.img.includes("Spotify")
                              ? 44
                              : 50
                    }
                    height={10}
                    className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>

                <span className="mt-2 text-md font-semibold text-center">
                  {link.label}
                </span>
              </a>
            ))}
          </section>
        </div>
      </section>

      {/*


      <Image
        src="/images/Ayuda.svg"
        alt="Pregunta"
        width={45}
        height={45}
        className="md:fixed md:bottom-6 md:right-6 md:mb-0 md:cursor-pointer mb-8"
      />
      

      <div className="mb-2">
        <p className="md:fixed md:bottom-12 md:left-4 text-md text-white opacity-50">
          Programador:{" "}
          <a
            href="https://wa.me/573218544162"
            className="font-semibold"
            target="_blank"
            rel="noreferrer"
          >
            Fabián Espitia
          </a>
        </p>
        <p className="md:fixed md:bottom-6 md:left-4 text-md bottom-2 text-white opacity-50">
          Diseñador:{" "}
          <a href="https://wa.me/573152543764" className="font-semibold">
            Carlos Gamboa
          </a>
        </p>
      </div>
      
      
      */}
    </>
  );
}
