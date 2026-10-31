import { useState } from "react";
import { Leaf, LockKeyhole, Mail } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../lib/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const redirect = params.get("redirect") || "/";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(identifier, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-leaf-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-500 text-white"><Leaf className="h-6 w-6" /></span>
          <div>
            <p className="font-bold text-white">Organic Shop</p>
            <p className="text-xs uppercase tracking-[0.18em] text-leaf-300">Admin panel</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-7 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Manage orders, products and the storefront.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Email or mobile</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} required className="input pl-10" placeholder="admin@organic.test" autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="input pl-10" placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">{busy ? "Signing in..." : "Sign in"}</button>
          </form>
          <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Demo admin</p>
            <p className="mt-1">admin@organic.test / Admin123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
