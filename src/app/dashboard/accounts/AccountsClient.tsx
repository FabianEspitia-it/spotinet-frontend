"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type Account = {
  id: string;
  email: string;
};

type AccountsResponse = {
  total: number;
  skip: number;
  limit: number;
  accounts: Account[];
};

type User = {
  id: string;
  email: string;
};

const PAGE_SIZE = 25;

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      return String(data.detail[0].msg);
    }
  } catch {
    /* fallthrough */
  }
  return `Error ${res.status}`;
}

export default function AccountsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkUploading, setBulkUploading] = useState(false);

  const [linkOpen, setLinkOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [accountQuery, setAccountQuery] = useState("");
  const [linkAccounts, setLinkAccounts] = useState<Account[]>([]);
  const [loadingLinkAccounts, setLoadingLinkAccounts] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
  const [linking, setLinking] = useState(false);
  const userSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setSkip(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchAccounts = useCallback(
    async (currentSkip: number, emailFilter: string, signal: AbortSignal) => {
      const params = new URLSearchParams();
      params.set("skip", String(currentSkip));
      params.set("limit", String(PAGE_SIZE));
      if (emailFilter) {
        params.set("email", emailFilter);
      }

      const res = await fetch(`/api/upstream/accounts?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!res.ok) {
        const msg = await readError(res);
        throw new Error(msg);
      }

      return (await res.json()) as AccountsResponse;
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const data = await fetchAccounts(skip, debouncedQuery, controller.signal);
        setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
        setTotal(typeof data?.total === "number" ? data.total : 0);
        setErrorMsg(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "No se pudo conectar con el servidor";
        setErrorMsg(message);
        setAccounts([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [skip, debouncedQuery, reloadToken, fetchAccounts]);

  function reload() {
    setReloadToken((k) => k + 1);
  }

  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : skip + 1;
  const rangeEnd = Math.min(skip + PAGE_SIZE, total);
  const canPrev = skip > 0 && !loading;
  const canNext = skip + PAGE_SIZE < total && !loading;

  function goPrev() {
    if (!canPrev) return;
    setSkip(Math.max(0, skip - PAGE_SIZE));
  }
  function goNext() {
    if (!canNext) return;
    setSkip(skip + PAGE_SIZE);
  }

  function openBulk() {
    setBulkText("");
    setBulkOpen(true);
  }

  async function handleBulkUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const lines = bulkText
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.error("Ingresa al menos un correo");
      return;
    }

    const payload = { accounts: lines.map((email) => ({ email })) };

    setBulkUploading(true);
    try {
      const res = await fetch("/api/upstream/accounts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error(await readError(res));
        return;
      }
      toast.success(`${lines.length} cuenta(s) subidas correctamente`);
      setBulkOpen(false);
      reload();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setBulkUploading(false);
    }
  }

  function openLink() {
    setUserQuery("");
    setSelectedUser(null);
    setUsers([]);
    setAccountQuery("");
    setLinkAccounts([]);
    setSelectedAccounts([]);
    setLinkOpen(true);
  }

  function handleUserQueryChange(value: string) {
    setUserQuery(value);
    setSelectedUser(null);
    setUsers([]);

    if (userSearchRef.current) clearTimeout(userSearchRef.current);

    const trimmed = value.trim();
    if (!trimmed) return;

    userSearchRef.current = setTimeout(async () => {
      setLoadingUsers(true);
      try {
        const params = new URLSearchParams({ email: trimmed, limit: "10" });
        const res = await fetch(`/api/upstream/users?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(Array.isArray(data?.users) ? data.users : []);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingUsers(false);
      }
    }, 300);
  }

  function handleAccountQueryChange(value: string) {
    setAccountQuery(value);
    setLinkAccounts([]);

    if (accountSearchRef.current) clearTimeout(accountSearchRef.current);

    const trimmed = value.trim();
    if (!trimmed) return;

    accountSearchRef.current = setTimeout(async () => {
      setLoadingLinkAccounts(true);
      try {
        const params = new URLSearchParams({ email: trimmed, limit: "10" });
        const res = await fetch(`/api/upstream/accounts?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setLinkAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
        }
      } catch {
        /* silent */
      } finally {
        setLoadingLinkAccounts(false);
      }
    }, 300);
  }

  const filteredUsers = selectedUser || !userQuery.trim() ? [] : users;

  const filteredLinkAccounts = !accountQuery.trim()
    ? []
    : linkAccounts.filter((a) => !selectedAccounts.some((s) => s.id === a.id));

  function selectUser(user: User) {
    setSelectedUser(user);
    setUserQuery(user.email);
  }

  function clearUser() {
    setSelectedUser(null);
    setUserQuery("");
  }

  function addAccount(account: Account) {
    setSelectedAccounts((prev) => [...prev, account]);
    setAccountQuery("");
  }

  function removeAccount(id: string) {
    setSelectedAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) {
      toast.error("Selecciona un usuario válido");
      return;
    }
    if (selectedAccounts.length === 0) {
      toast.error("Selecciona al menos una cuenta");
      return;
    }

    setLinking(true);
    try {
      const res = await fetch("/api/upstream/accounts/link-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          account_ids: selectedAccounts.map((a) => a.id),
        }),
      });
      if (!res.ok) {
        toast.error(await readError(res));
        return;
      }
      toast.success("Cuentas vinculadas correctamente");
      setLinkOpen(false);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Cuentas
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Administra las cuentas del sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openBulk}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary_blue px-4 py-2.5 text-sm font-semibold text-principal_blue transition hover:opacity-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            Subir cuentas
          </button>
          <button
            type="button"
            onClick={openLink}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-secondary_blue/30 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-secondary_blue/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.754a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.34 8.627"
              />
            </svg>
            Vincular usuario
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-secondary_blue/20 bg-principal_blue">
        <div className="flex flex-col gap-3 border-b border-secondary_blue/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-secondary_blue/70">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por correo"
              className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/60">
              {total === 0 ? "Sin resultados" : `Mostrando ${rangeStart}–${rangeEnd} de ${total.toLocaleString("es-CO")}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={!canPrev}
                className="inline-flex items-center gap-1 rounded-lg border border-secondary_blue/30 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-secondary_blue/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
                Anterior
              </button>
              <span className="text-xs text-white/50">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext}
                className="inline-flex items-center gap-1 rounded-lg border border-secondary_blue/30 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-secondary_blue/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-secondary_blue/5 text-xs uppercase tracking-wide text-secondary_blue/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Correo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary_blue/10">
              {loading && accounts.length === 0 && <SkeletonRows />}

              {!loading && errorMsg && (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center">
                    <p className="text-sm text-red-300">{errorMsg}</p>
                    <button
                      type="button"
                      onClick={reload}
                      className="mt-3 rounded-lg border border-secondary_blue/30 px-3 py-1.5 text-xs text-secondary_blue hover:bg-secondary_blue/10"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}

              {!loading && !errorMsg && accounts.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-sm text-white/60"
                  >
                    {debouncedQuery
                      ? "Ninguna cuenta coincide con la búsqueda."
                      : "No hay cuentas registradas. Sube la primera."}
                  </td>
                </tr>
              )}

              {!errorMsg &&
                accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="transition hover:bg-secondary_blue/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary_blue/15 text-sm font-semibold uppercase text-secondary_blue">
                          {account.email?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-white">
                          {account.email}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Subir cuentas masivamente */}
      {bulkOpen && (
        <Modal
          onClose={() => (!bulkUploading ? setBulkOpen(false) : undefined)}
          title="Subir cuentas masivamente"
        >
          <form onSubmit={handleBulkUpload} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-secondary_blue">
                Correos (uno por línea o separados por comas)
              </span>
              <textarea
                required
                autoFocus
                rows={6}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={"cuenta1@example.com\ncuenta2@example.com\ncuenta3@example.com"}
                className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkOpen(false)}
                disabled={bulkUploading}
                className="rounded-lg border border-secondary_blue/30 px-4 py-2 text-sm font-medium text-white/80 hover:bg-secondary_blue/10 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={bulkUploading}
                className="rounded-lg bg-secondary_blue px-4 py-2 text-sm font-semibold text-principal_blue transition hover:opacity-90 disabled:opacity-60"
              >
                {bulkUploading ? "Subiendo…" : "Subir cuentas"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Vincular usuario con cuentas */}
      {linkOpen && (
        <Modal
          onClose={() => (!linking ? setLinkOpen(false) : undefined)}
          title="Vincular usuario con cuentas"
        >
          <form onSubmit={handleLink} className="space-y-4">
            <div className="relative">
              <span className="mb-1 block text-xs font-medium text-secondary_blue">
                Correo del usuario
              </span>
              {selectedUser ? (
                <div className="flex items-center justify-between rounded-lg border border-secondary_blue/30 bg-secondary_blue/10 px-3 py-2">
                  <span className="text-sm text-white">{selectedUser.email}</span>
                  <button
                    type="button"
                    onClick={clearUser}
                    className="ml-2 rounded p-0.5 text-white/60 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    value={userQuery}
                    onChange={(e) => handleUserQueryChange(e.target.value)}
                    placeholder="Escribe el correo del usuario"
                    className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 pr-8 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
                  />
                  {loadingUsers && (
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="h-4 w-4 animate-spin text-secondary_blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                    </span>
                  )}
                </div>
              )}
              {filteredUsers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-36 w-full overflow-y-auto rounded-lg border border-secondary_blue/20 bg-principal_blue shadow-lg">
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-secondary_blue/10"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary_blue/15 text-xs font-semibold uppercase text-secondary_blue">
                        {u.email[0]}
                      </div>
                      {u.email}
                    </button>
                  ))}
                </div>
              )}
              {userQuery.trim() && !selectedUser && filteredUsers.length === 0 && !loadingUsers && (
                <p className="mt-1 text-xs text-white/40">No se encontró ningún usuario con ese correo.</p>
              )}
            </div>

            <div className="relative">
              <span className="mb-1 block text-xs font-medium text-secondary_blue">
                Correo de la cuenta
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={accountQuery}
                  onChange={(e) => handleAccountQueryChange(e.target.value)}
                  placeholder="Escribe el correo de la cuenta"
                  className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 pr-8 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
                />
                {loadingLinkAccounts && (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="h-4 w-4 animate-spin text-secondary_blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                  </span>
                )}
              </div>
              {filteredLinkAccounts.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-36 w-full overflow-y-auto rounded-lg border border-secondary_blue/20 bg-principal_blue shadow-lg">
                  {filteredLinkAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => addAccount(acc)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white hover:bg-secondary_blue/10"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary_blue/15 text-xs font-semibold uppercase text-secondary_blue">
                        {acc.email[0]}
                      </div>
                      {acc.email}
                    </button>
                  ))}
                </div>
              )}
              {accountQuery.trim() && filteredLinkAccounts.length === 0 && !loadingLinkAccounts && (
                <p className="mt-1 text-xs text-white/40">No se encontró ninguna cuenta con ese correo.</p>
              )}
            </div>

            {selectedAccounts.length > 0 && (
              <div>
                <span className="mb-1 block text-xs font-medium text-secondary_blue">
                  Cuentas seleccionadas ({selectedAccounts.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedAccounts.map((acc) => (
                    <span
                      key={acc.id}
                      className="inline-flex items-center gap-1 rounded-full border border-secondary_blue/30 bg-secondary_blue/10 px-2.5 py-1 text-xs text-white"
                    >
                      {acc.email}
                      <button
                        type="button"
                        onClick={() => removeAccount(acc.id)}
                        className="ml-0.5 rounded-full p-0.5 text-white/60 hover:text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkOpen(false)}
                disabled={linking}
                className="rounded-lg border border-secondary_blue/30 px-4 py-2 text-sm font-medium text-white/80 hover:bg-secondary_blue/10 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={linking}
                className="rounded-lg bg-secondary_blue px-4 py-2 text-sm font-semibold text-principal_blue transition hover:opacity-90 disabled:opacity-60"
              >
                {linking ? "Vinculando…" : "Vincular"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-secondary_blue/10" />
              <div className="h-3 w-40 animate-pulse rounded bg-secondary_blue/10" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="ml-auto h-3 w-20 animate-pulse rounded bg-secondary_blue/10" />
          </td>
        </tr>
      ))}
    </>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-secondary_blue/30 bg-principal_blue p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/60 hover:bg-secondary_blue/10 hover:text-white"
            aria-label="Cerrar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
