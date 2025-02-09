import { motion } from "framer-motion";

function Loader() {
  return (
    <div className="flex items-center justify-center bg-transparent">
      <motion.img
        src="/images/logo_spotinet.png"
        alt="Loading..."
        className="w-24 h-24"
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
    </div>
  );
}

export default Loader;
