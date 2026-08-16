"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type Account = {
  id: string;
  email: string;
};

type User = {
  id: string;
  email: string;
  accounts?: Account[];
};

type ListResponse = {
  total: number;
  skip: number;
  limit: number;
  users?: User[];
};

const PAGE_SIZE = 20;

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

export default function UsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [unlinkTarget, setUnlinkTarget] = useState<User | null>(null);
  const [unlinkQuery, setUnlinkQuery] = useState("");
  const [selectedUnlinkIds, setSelectedUnlinkIds] = useState<string[]>([]);
  const [unlinking, setUnlinking] = useState(false);

  const [accountEmailQuery, setAccountEmailQuery] = useState("");

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [debouncedAccountEmail, setDebouncedAccountEmail] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setSkip(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAccountEmail(accountEmailQuery.trim());
      setSkip(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [accountEmailQuery]);

  const fetchUsers = useCallback(
    async (currentSkip: number, emailFilter: string, accountEmail: string, signal: AbortSignal) => {
      const params = new URLSearchParams();
      params.set("skip", String(currentSkip));
      params.set("limit", String(PAGE_SIZE));
      if (emailFilter) {
        params.set("email", emailFilter);
      }
      if (accountEmail) {
        params.set("account_email", accountEmail);
      }

      const res = await fetch(`/api/upstream/users?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!res.ok) {
        const msg = await readError(res);
        throw new Error(msg);
      }

      return (await res.json()) as ListResponse;
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setErrorMsg(null);

    (async () => {
      try {
        const data = await fetchUsers(skip, debouncedQuery, debouncedAccountEmail, controller.signal);
        setUsers(Array.isArray(data?.users) ? data.users : []);
        setTotal(typeof data?.total === "number" ? data.total : 0);
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "No se pudo conectar con el servidor";
        setErrorMsg(message);
        setUsers([]);
        setTotal(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [skip, debouncedQuery, debouncedAccountEmail, reloadToken, fetchUsers]);

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

  function openCreate() {
    setCreateEmail("");
    setCreatePassword("");
    setCreateOpen(true);
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = createEmail.trim();
    const password = createPassword;
    if (!email || !password) {
      toast.error("Email y contraseña son obligatorios");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/upstream/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        toast.error(await readError(res));
        return;
      }
      toast.success("Usuario creado");
      setCreateOpen(false);
      reload();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(user: User) {
    setDeletingId(user.id);
    try {
      const res = await fetch(
        `/api/upstream/users/${encodeURIComponent(user.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error(await readError(res));
        return;
      }
      toast.success("Usuario eliminado");
      setConfirmDelete(null);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      toast.error("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  }

  function openPassword(user: User) {
    setPasswordTarget(user);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!passwordTarget) return;

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(
        `/api/upstream/users/${encodeURIComponent(passwordTarget.id)}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPassword }),
        }
      );
      if (!res.ok) {
        toast.error(await readError(res));
        return;
      }
      toast.success("Contraseña actualizada");
      setPasswordTarget(null);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSavingPassword(false);
    }
  }

  function openUnlink(user: User) {
    setUnlinkTarget(user);
    setUnlinkQuery("");
    setSelectedUnlinkIds([]);
  }

  const filteredUnlinkAccounts = useMemo(() => {
    if (!unlinkTarget?.accounts) return [];
    const raw = unlinkQuery.trim().toLowerCase();
    if (!raw) return unlinkTarget.accounts;
    const terms = raw
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (terms.length === 0) return unlinkTarget.accounts;
    return unlinkTarget.accounts.filter((a) =>
      terms.some((t) => a.email.toLowerCase().includes(t))
    );
  }, [unlinkTarget, unlinkQuery]);

  function selectAllUnlink() {
    const ids = filteredUnlinkAccounts.map((a) => a.id);
    setSelectedUnlinkIds((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return [...new Set([...prev, ...ids])];
    });
  }

  function toggleUnlink(id: string) {
    setSelectedUnlinkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleUnlink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!unlinkTarget) return;
    if (selectedUnlinkIds.length === 0) {
      toast.error("Selecciona al menos una cuenta");
      return;
    }

    setUnlinking(true);
    try {
      const res = await fetch("/api/upstream/accounts/unlink-user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: unlinkTarget.id,
          account_ids: selectedUnlinkIds,
        }),
      });
      if (!res.ok) {
        toast.error(await readError(res));
        return;
      }
      toast.success("Cuentas desvinculadas correctamente");
      setUsers((prev) =>
        prev.map((u) =>
          u.id === unlinkTarget.id
            ? {
                ...u,
                accounts: u.accounts?.filter(
                  (a) => !selectedUnlinkIds.includes(a.id)
                ),
              }
            : u
        )
      );
      setUnlinkTarget(null);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Usuarios
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Administra los usuarios con acceso al panel.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Crear usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-secondary_blue/20 bg-principal_blue">
        <div className="flex flex-col gap-3 border-b border-secondary_blue/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:max-w-lg">
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
                placeholder="Buscar por correo de usuario"
                className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </div>
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
                    d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
                  />
                </svg>
              </span>
              <input
                type="search"
                value={accountEmailQuery}
                onChange={(e) => setAccountEmailQuery(e.target.value)}
                placeholder="Buscar por cuenta vinculada"
                className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </div>
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
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-secondary_blue/5 text-xs uppercase tracking-wide text-secondary_blue/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuario / Cuentas vinculadas</th>
                <th className="w-72 px-4 py-3 text-right font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary_blue/10">
              {loading && users.length === 0 && <SkeletonRows />}

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

              {!loading && !errorMsg && users.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-sm text-white/60"
                  >
                    {users.length === 0 && !debouncedQuery && !debouncedAccountEmail
                      ? "Todavía no hay usuarios. Crea el primero."
                      : "Ningún usuario coincide con la búsqueda."}
                  </td>
                </tr>
              )}

              {!errorMsg &&
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-secondary_blue/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary_blue/15 text-sm font-semibold uppercase text-secondary_blue">
                          {user.email?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-medium text-white">
                            {user.email}
                          </span>
                          {user.accounts && user.accounts.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {user.accounts.map((acc) => (
                                <li
                                  key={acc.id}
                                  className="flex items-center gap-1.5 text-xs text-secondary_blue/80"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    className="h-3 w-3 shrink-0 opacity-60"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {acc.email}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {user.accounts && user.accounts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => openUnlink(user)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary_blue/30 px-3 py-1.5 text-xs font-medium text-secondary_blue transition hover:bg-secondary_blue/10"
                          >
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
                                d="M13.181 8.68a4.503 4.503 0 0 1 1.903 6.405m-9.768-2.782L3.56 14.06a4.5 4.5 0 0 0 6.364 6.365l3.129-3.129m5.614-5.615 1.757-1.757a4.5 4.5 0 0 0-6.364-6.365l-4.5 4.5c-.258.26-.479.541-.661.84m1.903 1.903L9.75 15"
                              />
                            </svg>
                            Desvincular cuentas
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openPassword(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-secondary_blue/30 px-3 py-1.5 text-xs font-medium text-secondary_blue transition hover:bg-secondary_blue/10"
                        >
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
                              d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
                            />
                          </svg>
                          Cambiar contraseña
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                        >
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
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear usuario */}
      {createOpen && (
        <Modal
          onClose={() => (!creating ? setCreateOpen(false) : undefined)}
          title="Crear usuario"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-secondary_blue">
                Correo
              </span>
              <input
                type="email"
                required
                autoFocus
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="usuario@correo.com"
                className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-secondary_blue">
                Contraseña
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
                className="rounded-lg border border-secondary_blue/30 px-4 py-2 text-sm font-medium text-white/80 hover:bg-secondary_blue/10 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-secondary_blue px-4 py-2 text-sm font-semibold text-principal_blue transition hover:opacity-90 disabled:opacity-60"
              >
                {creating ? "Creando…" : "Crear usuario"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Eliminar usuario */}
      {confirmDelete && (
        <Modal
          onClose={() => (!deletingId ? setConfirmDelete(null) : undefined)}
          title="Eliminar usuario"
        >
          <p className="text-sm text-white/80">
            ¿Seguro que deseas eliminar el usuario{" "}
            <span className="font-semibold text-white">
              {confirmDelete.email}
            </span>
            ? Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              disabled={deletingId !== null}
              className="rounded-lg border border-secondary_blue/30 px-4 py-2 text-sm font-medium text-white/80 hover:bg-secondary_blue/10 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleDelete(confirmDelete)}
              disabled={deletingId !== null}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {deletingId !== null ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Cambiar contraseña */}
      {passwordTarget && (
        <Modal
          onClose={() => (!savingPassword ? setPasswordTarget(null) : undefined)}
          title="Asignar nueva contraseña"
        >
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-sm text-white/70">
              Usuario:{" "}
              <span className="font-semibold text-white">
                {passwordTarget.email}
              </span>
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-secondary_blue">
                Nueva contraseña
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoFocus
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-secondary_blue">
                Confirmar contraseña
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-white/70">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4 rounded border-secondary_blue/30 bg-principal_blue accent-secondary_blue"
              />
              Mostrar contraseñas
            </label>

            <p className="text-xs text-white/50">
              Al cambiar la contraseña se cerrarán las sesiones activas del
              usuario.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasswordTarget(null)}
                disabled={savingPassword}
                className="rounded-lg border border-secondary_blue/30 px-4 py-2 text-sm font-medium text-white/80 hover:bg-secondary_blue/10 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-lg bg-secondary_blue px-4 py-2 text-sm font-semibold text-principal_blue transition hover:opacity-90 disabled:opacity-60"
              >
                {savingPassword ? "Guardando…" : "Guardar contraseña"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Desvincular cuentas */}
      {unlinkTarget && (
        <Modal
          onClose={() => (!unlinking ? setUnlinkTarget(null) : undefined)}
          title="Desvincular cuentas"
        >
          <form onSubmit={handleUnlink} className="space-y-4">
            <p className="text-sm text-white/70">
              Usuario:{" "}
              <span className="font-semibold text-white">
                {unlinkTarget.email}
              </span>
            </p>

            <div>
              <span className="mb-2 block text-xs font-medium text-secondary_blue">
                Cuentas vinculadas
              </span>
              <div className="relative mb-2">
                <textarea
                  value={unlinkQuery}
                  onChange={(e) => setUnlinkQuery(e.target.value)}
                  placeholder="Pegar cuentas (una por línea, separadas por coma o punto y coma)..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-secondary_blue/30 bg-principal_blue px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-secondary_blue focus:outline-none focus:ring-1 focus:ring-secondary_blue"
                />
              </div>

              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={selectAllUnlink}
                  className="rounded-md border border-secondary_blue/30 px-3 py-1 text-xs font-medium text-secondary_blue transition hover:bg-secondary_blue/10"
                >
                  {filteredUnlinkAccounts.length > 0 &&
                  filteredUnlinkAccounts.every((a) =>
                    selectedUnlinkIds.includes(a.id)
                  )
                    ? "Deseleccionar todas"
                    : "Seleccionar todas"}
                </button>
                {selectedUnlinkIds.length > 0 && (
                  <span className="text-xs text-white/50">
                    {selectedUnlinkIds.length} cuenta(s) seleccionada(s)
                  </span>
                )}
              </div>

              {filteredUnlinkAccounts.length === 0 ? (
                <p className="py-4 text-center text-sm text-white/40">
                  No hay cuentas vinculadas.
                </p>
              ) : (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-secondary_blue/20 p-2">
                  {filteredUnlinkAccounts.map((acc) => (
                    <label
                      key={acc.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white transition hover:bg-secondary_blue/10"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUnlinkIds.includes(acc.id)}
                        onChange={() => toggleUnlink(acc.id)}
                        className="h-4 w-4 rounded border-secondary_blue/30 bg-principal_blue accent-secondary_blue"
                      />
                      {acc.email}
                    </label>
                  ))}
                </div>
              )}

            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnlinkTarget(null)}
                disabled={unlinking}
                className="rounded-lg border border-secondary_blue/30 px-4 py-2 text-sm font-medium text-white/80 hover:bg-secondary_blue/10 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={unlinking || selectedUnlinkIds.length === 0}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {unlinking ? "Desvinculando…" : "Desvincular"}
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
              <div className="space-y-1.5">
                <div className="h-3 w-40 animate-pulse rounded bg-secondary_blue/10" />
                <div className="h-2.5 w-32 animate-pulse rounded bg-secondary_blue/10" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="ml-auto h-7 w-36 animate-pulse rounded bg-secondary_blue/10" />
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
