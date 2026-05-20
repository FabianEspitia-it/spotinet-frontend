import RequestsClient from "./RequestsClient";

export const metadata = {
  title: "Solicitudes · Spotinet",
};

export const dynamic = "force-dynamic";

export default function RequestsPage() {
  return <RequestsClient />;
}
