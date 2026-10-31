import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { dateTime } from "../lib/format";
import { EmptyState, ErrorState, Loading } from "../components/Loading";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  orderId?: string | null;
  createdAt: string;
}

export function Notifications() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ notifications: Notification[] }>("/notifications?pageSize=50");
      setItems(data.notifications);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
  };

  const markAll = async () => {
    await api("/notifications/read-all", { method: "POST" });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-stone-900">{t("account.notifications")}</h2>
        {items.some((item) => !item.read) && (
          <button onClick={markAll} className="flex items-center gap-1 text-sm font-semibold text-leaf-700 hover:text-leaf-900">
            <CheckCheck className="h-4 w-4" /> {lang === "bn" ? "সব পড়া হয়েছে" : "Mark all read"}
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="mt-5"><EmptyState title={t("account.notificationsEmpty")} /></div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.read && markRead(item.id)}
              className={`flex w-full gap-3 rounded-2xl border p-4 text-left transition ${item.read ? "border-stone-200 bg-white" : "border-leaf-200 bg-leaf-50/60"}`}
            >
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.read ? "bg-stone-100 text-stone-500" : "bg-leaf-100 text-leaf-700"}`}>
                <Bell className="h-4 w-4" />
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-stone-800">{item.title}</span>
                  {!item.read && <span className="h-2 w-2 rounded-full bg-leaf-500" />}
                </span>
                <span className="mt-1 block text-sm text-stone-600">{item.message}</span>
                <span className="mt-1 block text-xs text-stone-400">{dateTime(item.createdAt, lang)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
