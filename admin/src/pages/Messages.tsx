import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import type { ContactMessage } from "../types";
import { dateTime } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { EmptyState, ErrorState, Field, Loading, Modal, PageHeader } from "../components/ui";

export function Messages() {
  const { show } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "handled">("all");
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ messages: ContactMessage[] }>("/contact");
      setMessages(data.messages);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleHandled = async (message: ContactMessage) => {
    try {
      await api(`/contact/${message.id}`, { method: "PATCH", body: { handled: !message.handled } });
      setSelected(null);
      await load();
    } catch (err) {
      show(errorMessage(err), "error");
    }
  };

  const sendBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api<{ sent: number }>("/notifications/broadcast", { method: "POST", body: { title, message: body } });
      show(`Notification sent to ${data.sent} customers`);
      setBroadcastOpen(false);
      setTitle("");
      setBody("");
    } catch (err) {
      show(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const visible = messages.filter((message) => {
    if (filter === "open") return !message.handled;
    if (filter === "handled") return message.handled;
    return true;
  });
  const openCount = messages.filter((message) => !message.handled).length;

  return (
    <div>
      <PageHeader title="Messages" subtitle="Customer enquiries and storewide announcements." action={<button onClick={() => setBroadcastOpen(true)} className="btn-primary"><Bell className="h-4 w-4" /> Send announcement</button>} />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "open", "handled"] as const).map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === value ? "bg-leaf-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {value === "all" ? `All (${messages.length})` : value === "open" ? `Open (${openCount})` : `Handled (${messages.length - openCount})`}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : error ? <ErrorState message={error} /> : visible.length === 0 ? (
        <EmptyState title="No messages here" text={filter === "open" ? "Every enquiry has been handled." : "Contact form submissions will appear here."} />
      ) : (
        <div className="space-y-3">
          {visible.map((message) => (
            <button key={message.id} onClick={() => setSelected(message)} className="block w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card transition hover:border-leaf-300 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${message.handled ? "bg-slate-100 text-slate-400" : "bg-leaf-50 text-leaf-700"}`}><MessageSquare className="h-5 w-5" /></span>
                  <div>
                    <p className="font-semibold text-slate-800">{message.subject}</p>
                    <p className="text-xs text-slate-500">{message.name} · {message.email || message.phone || "No contact details"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{dateTime(message.createdAt)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${message.handled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{message.handled ? "Handled" : "Open"}</span>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{message.message}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={selected.subject} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-800">{selected.name}</p>
              {selected.email && <p className="mt-1 flex items-center gap-1.5 text-slate-600"><Mail className="h-3.5 w-3.5" /> {selected.email}</p>}
              {selected.phone && <p className="flex items-center gap-1.5 text-slate-600"><Phone className="h-3.5 w-3.5" /> {selected.phone}</p>}
              <p className="mt-1 text-xs text-slate-400">{dateTime(selected.createdAt)}</p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{selected.message}</p>
            <button onClick={() => toggleHandled(selected)} className={selected.handled ? "btn-secondary w-full" : "btn-primary w-full"}>
              <CheckCircle2 className="h-4 w-4" /> {selected.handled ? "Mark as open" : "Mark as handled"}
            </button>
          </div>
        </Modal>
      )}

      {broadcastOpen && (
        <Modal title="Send announcement" onClose={() => setBroadcastOpen(false)}>
          <form onSubmit={sendBroadcast} className="space-y-4">
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">This sends an in-app notification to every active customer.</p>
            <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} required className="input" placeholder="Fresh harvest is here" /></Field>
            <Field label="Message"><textarea value={body} onChange={(event) => setBody(event.target.value)} required rows={4} className="input" placeholder="Write a short announcement..." /></Field>
            <div className="flex gap-3">
              <button disabled={busy} className="btn-primary flex-1"><Send className="h-4 w-4" /> {busy ? "Sending..." : "Send to all customers"}</button>
              <button type="button" onClick={() => setBroadcastOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
