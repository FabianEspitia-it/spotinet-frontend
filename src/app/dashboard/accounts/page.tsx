import AccountsClient from "./AccountsClient";

export const metadata = {
  title: "Cuentas · Spotinet",
};

export const dynamic = "force-dynamic";

export default function AccountsPage() {
  return <AccountsClient />;
}
