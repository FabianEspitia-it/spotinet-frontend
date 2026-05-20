import UsersClient from "./UsersClient";

export const metadata = {
  title: "Usuarios · Spotinet",
};

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return <UsersClient />;
}
