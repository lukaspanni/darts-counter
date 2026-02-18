import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="flex w-full justify-end bg-gray-800 p-4 text-white">
      <Link href="https://lukaspanni.de/legal">Legal Info</Link>
    </footer>
  );
};
