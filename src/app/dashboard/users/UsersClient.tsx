"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

type User = {
  id: string;
  email: string;
};

type ListResponse = {
  users?: User[];
};

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/upstream/users", {
          method: "GET",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) {
          const msg = await readError(res);
          if (cancelled) return;
          setErrorMsg(msg);
          setUsers([]);
          return;
        }
        const data = (await res.json()) as ListResponse;
        if (cancelled) return;
        setUsers(Array.isArray(data?.users) ? data.users : []);
        setErrorMsg(null);
      } catch {
        if (cancelled) return;
        setErrorMsg("No se pudo conectar con el servidor");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  function reload() {
    setLoading(true);
    setErrorMsg(null);
    setReloadToken((k) => k + 1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.email.toLowerCase().includes(q));
  }, [users, query]);

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
          <span className="text-xs text-white/60">
            {filtered.length} de {users.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-secondary_blue/5 text-xs uppercase tracking-wide text-secondary_blue/80">
              <tr>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="w-32 px-4 py-3 text-right font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary_blue/10">
              {loading && users.length === 0 && (
                <SkeletonRows />
              )}

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

              {!loading && !errorMsg && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-sm text-white/60"
                  >
                    {users.length === 0
                      ? "Todavía no hay usuarios. Crea el primero."
                      : "Ningún usuario coincide con la búsqueda."}
                  </td>
                </tr>
              )}

              {!errorMsg &&
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-secondary_blue/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary_blue/15 text-sm font-semibold uppercase text-secondary_blue">
                          {user.email?.[0] ?? "?"}
                        </div>
                        <span className="font-medium text-white">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
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

      {confirmDelete && (
        <Modal
          onClose={() =>
            !deletingId ? setConfirmDelete(null) : undefined
          }
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
            <div className="ml-auto h-7 w-20 animate-pulse rounded bg-secondary_blue/10" />
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
