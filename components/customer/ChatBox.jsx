// "use client";

// import { motion, AnimatePresence } from "framer-motion";
// import { format } from "date-fns";
// import React, { useEffect, useRef, useState } from "react";
// import { useAuth } from "@/context/AuthContext"; // adjust if your AuthContext path differs

// // Try to use your axios instance if available
// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// export default function ChatBox({ selected, userEmail: propUserEmail }) {
//   const { token, user } = useAuth();
//   const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";

//   const [messages, setMessages] = useState([]); // { id, text, at, from, status }
//   const [loading, setLoading] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [msgText, setMsgText] = useState("");
//   const [error, setError] = useState(null);

//   const containerRef = useRef(null);

//   const messageItem = {
//     hidden: { opacity: 0, y: 6 },
//     visible: { opacity: 1, y: 0 },
//     exit: { opacity: 0, y: -6 },
//   };

//   // Helper: scroll to bottom
//   function scrollToBottom() {
//     try {
//       const el = containerRef.current;
//       if (!el) return;
//       // scroll to bottom smoothly
//       el.scrollTop = el.scrollHeight;
//     } catch (e) {
//       /* ignore */
//     }
//   }

//   // Normalize server response -> array of messages
//   function normalizeMessagesPayload(payload) {
//     // payload may be: { messages: [...] } or [...] or { data: [...] }
//     if (!payload) return [];
//     if (Array.isArray(payload)) return payload;
//     if (Array.isArray(payload.messages)) return payload.messages;
//     if (Array.isArray(payload.data)) return payload.data;
//     if (Array.isArray(payload.results)) return payload.results;
//     // otherwise try to coerce if nested
//     const maybe = payload?.data?.messages ?? payload?.messages ?? payload;
//     if (Array.isArray(maybe)) return maybe;
//     return [];
//   }

//   // Load chats for selected ticket
//   useEffect(() => {
//     let mounted = true;
//     const abortController = new AbortController();

//     async function loadChats() {
//       if (!selected?.id) {
//         setMessages([]);
//         return;
//       }
//       setLoading(true);
//       setError(null);

//       const endpoint = `/tickets/get/chats/${selected.id}/`;
//       try {
//         let data;
//         if (api && typeof api.get === "function") {
//           const headers = token ? { Authorization: `Bearer ${token}` } : {};
//           const res = await api.get(endpoint, {
//             headers,
//             signal: abortController.signal,
//           });
//           data = res?.data;
//         } else {
//           const res = await fetch(endpoint, {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             signal: abortController.signal,
//           });
//           if (!res.ok) throw new Error(`Failed to load chats (${res.status})`);
//           data = await res.json();
//         }

//         if (!mounted) return;
//         const raw = normalizeMessagesPayload(data);

//         // Map to normalized shape used in UI
//         const mapped = raw.map((m, i) => ({
//           id: m.id ?? m.message_id ?? `${m.at ?? Date.now()}_${i}`,
//           text: m.text ?? m.body ?? m.message ?? "",
//           at:
//             m.at ??
//             m.createdAt ??
//             m.created_at ??
//             m.timestamp ??
//             new Date().toISOString(),
//           from: m.from ?? m.sender ?? m.email ?? m.username ?? "unknown",
//           status: "sent",
//         }));

//         setMessages(mapped);
//         // small delay then scroll
//         requestAnimationFrame(scrollToBottom);
//       } catch (err) {
//         if (err.name === "AbortError") return;
//         console.error("Failed to load chats:", err);
//         setError(err.message || "Failed to load chats");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     loadChats();
//     return () => {
//       mounted = false;
//       abortController.abort();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selected?.id, token]);

//   // auto-scroll when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages.length]);

//   // send a message (optimistic)
//   async function sendMessage(e) {
//     if (e && e.preventDefault) e.preventDefault();
//     setError(null);

//     const text = (msgText || "").trim();
//     if (!text || !selected?.id) return;

//     const ticket_id = selected.id;
//     const tempId = `tmp-${Date.now()}`;

//     const pendingMsg = {
//       id: tempId,
//       text,
//       at: new Date().toISOString(),
//       from: userEmail,
//       status: "pending",
//     };

//     // optimistic append
//     setMessages((s) => [...s, pendingMsg]);
//     setMsgText("");
//     setSending(true);

//     const endpoint = "/tickets/add-message/";
//     try {
//       let respData;
//       if (api && typeof api.post === "function") {
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};
//         const res = await api.post(endpoint, { ticket_id, text }, { headers });
//         respData = res?.data;
//       } else {
//         const res = await fetch(endpoint, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({ ticket_id, text }),
//         });
//         if (!res.ok) {
//           const body = await res.text().catch(() => "");
//           throw new Error(`Send failed (${res.status}) ${body}`);
//         }
//         respData = await res.json().catch(() => ({}));
//       }

//       // normalize response message(s)
//       // server may return created message or whole messages array; try to find created message
//       let created;
//       if (respData == null) {
//         created = {
//           id: `${ticket_id}-${Date.now()}`,
//           text,
//           at: new Date().toISOString(),
//           from: userEmail,
//         };
//       } else if (respData.message) {
//         created = respData.message;
//       } else if (respData.data && respData.data.message) {
//         created = respData.data.message;
//       } else if (Array.isArray(respData)) {
//         // maybe returns full list — take last
//         const arr = respData;
//         created = arr[arr.length - 1] || null;
//       } else if (respData.id || respData.message_id) {
//         created = respData;
//       } else {
//         // fallback to minimal
//         created = {
//           id: respData.id ?? `msg-${Date.now()}`,
//           text,
//           at: respData.at ?? new Date().toISOString(),
//           from: respData.from ?? userEmail,
//         };
//       }

//       // map created to normalized
//       const mapped = {
//         id: created.id ?? created.message_id ?? `${ticket_id}-${Date.now()}`,
//         text: created.text ?? created.body ?? created.message ?? text,
//         at:
//           created.at ??
//           created.created_at ??
//           created.timestamp ??
//           new Date().toISOString(),
//         from: created.from ?? created.sender ?? userEmail,
//         status: "sent",
//       };

//       // replace pending message with mapped message
//       setMessages((s) => s.map((m) => (m.id === tempId ? mapped : m)));
//       // ensure scroll
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       console.error("Failed to send message:", err);
//       setError(err.message || "Failed to send message");

//       // mark the pending message as failed so user can retry
//       setMessages((s) =>
//         s.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
//       );
//     } finally {
//       setSending(false);
//     }
//   }

//   // retry sending a failed message (sends using server and updates)
//   async function retryMessage(msg) {
//     if (!msg || msg.status !== "failed") return;
//     // set to pending
//     setMessages((s) =>
//       s.map((m) => (m.id === msg.id ? { ...m, status: "pending" } : m))
//     );
//     try {
//       const endpoint = "/tickets/add-message/";
//       const ticket_id = selected.id;
//       let respData;
//       if (api && typeof api.post === "function") {
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};
//         const res = await api.post(
//           endpoint,
//           { ticket_id, text: msg.text },
//           { headers }
//         );
//         respData = res?.data;
//       } else {
//         const res = await fetch(endpoint, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//           body: JSON.stringify({ ticket_id, text: msg.text }),
//         });
//         if (!res.ok) throw new Error(`Retry failed (${res.status})`);
//         respData = await res.json().catch(() => ({}));
//       }

//       const created = respData.message ?? respData;
//       const mapped = {
//         id: created.id ?? `msg-${Date.now()}`,
//         text: created.text ?? created.body ?? msg.text,
//         at: created.at ?? created.created_at ?? new Date().toISOString(),
//         from: created.from ?? userEmail,
//         status: "sent",
//       };

//       setMessages((s) => s.map((m) => (m.id === msg.id ? mapped : m)));
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       console.error("Retry failed:", err);
//       setMessages((s) =>
//         s.map((m) => (m.id === msg.id ? { ...m, status: "failed" } : m))
//       );
//       setError(err.message || "Retry failed");
//     }
//   }

//   return (
//     <motion.div
//       layout
//       className="lg:col-span-1 bg-white rounded shadow p-4 flex flex-col"
//     >
//       <div className="mb-3">
//         <h3 className="font-medium text-slate-800">Conversation</h3>
//         <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
//       </div>

//       {!selected ? (
//         <div className="p-6 text-sm text-slate-500">
//           No ticket selected. Select a ticket from the list on the right.
//         </div>
//       ) : (
//         <>
//           <motion.div layout className="border rounded p-3 mb-4">
//             <div className="text-sm font-semibold">
//               {selected.category || selected.categoryTitle || "Subject"}
//             </div>
//             <div className="text-xs text-slate-400 mt-1">
//               Ticket ID:{" "}
//               <span className="text-xs text-indigo-600">{selected.id}</span>
//             </div>
//             <div className="text-xs text-slate-400">
//               Priority:{" "}
//               <span className="inline-block ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
//                 Low
//               </span>
//             </div>
//           </motion.div>

//           <div
//             ref={containerRef}
//             className="space-y-3 max-h-[320px] overflow-auto mb-4 flex-1"
//           >
//             {/* system intro */}
//             <motion.div
//               initial={{ opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-blue-600 text-white rounded p-3 text-sm"
//             >
//               Support — Welcome to HelpDesk! Your ticket is being routed, an
//               agent will join shortly.
//             </motion.div>

//             <AnimatePresence initial={false}>
//               {loading ? (
//                 <motion.div
//                   key="loading"
//                   className="text-sm text-slate-500 p-3"
//                 >
//                   Loading messages…
//                 </motion.div>
//               ) : null}

//               {messages.map((m) => (
//                 <motion.div
//                   key={m.id}
//                   variants={messageItem}
//                   initial="hidden"
//                   animate="visible"
//                   exit="exit"
//                   className={`p-3 rounded max-w-[90%] ${
//                     m.from === userEmail
//                       ? "bg-slate-100 self-end ml-auto text-slate-800"
//                       : "bg-white border text-slate-800"
//                   }`}
//                 >
//                   <div className="text-sm">{m.text}</div>
//                   <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
//                     <span>{format(new Date(m.at), "PPpp")}</span>
//                     {m.status === "pending" && (
//                       <span className="text-xs text-amber-600">• Sending…</span>
//                     )}
//                     {m.status === "failed" && (
//                       <>
//                         <span className="text-xs text-red-600">• Failed</span>
//                         <button
//                           onClick={() => retryMessage(m)}
//                           className="ml-2 text-xs text-blue-600 underline"
//                         >
//                           Retry
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>

//             {messages.length === 0 && !loading && (
//               <div className="text-sm text-slate-400">No messages yet.</div>
//             )}
//           </div>

//           <form onSubmit={sendMessage} className="flex gap-2 items-center mt-2">
//             <input
//               className="flex-1 border px-3 py-2 rounded"
//               placeholder="Type a message..."
//               value={msgText}
//               onChange={(e) => setMsgText(e.target.value)}
//               disabled={sending}
//             />
//             <motion.button
//               whileTap={{ scale: 0.98 }}
//               type="submit"
//               disabled={sending}
//               className="bg-blue-600 text-white px-3 py-2 rounded"
//             >
//               {sending ? "Sending..." : "Send"}
//             </motion.button>
//           </form>

//           {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
//         </>
//       )}
//     </motion.div>
//   );
// }

// "use client";

// import { motion, AnimatePresence } from "framer-motion";
// import { format } from "date-fns";
// import React, { useEffect, useRef, useState } from "react";
// import { useAuth } from "@/context/AuthContext"; // adjust path if needed

// // try to use axios instance if available
// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// export default function ChatBox({ selected, userEmail: propUserEmail }) {
//   const { token, user } = useAuth();
//   const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";

//   // prefer explicit app_user_id fields from user object
//   const appUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const [messages, setMessages] = useState([]); // { id, text, at, from, status }
//   const [loading, setLoading] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [msgText, setMsgText] = useState("");
//   const [error, setError] = useState(null);

//   const containerRef = useRef(null);

//   const messageItem = {
//     hidden: { opacity: 0, y: 6 },
//     visible: { opacity: 1, y: 0 },
//     exit: { opacity: 0, y: -6 },
//   };

//   function scrollToBottom() {
//     try {
//       const el = containerRef.current;
//       if (!el) return;
//       el.scrollTop = el.scrollHeight;
//     } catch (e) {
//       /* ignore */
//     }
//   }

//   function normalizeMessagesPayload(payload) {
//     if (!payload) return [];
//     if (Array.isArray(payload)) return payload;
//     if (Array.isArray(payload.messages)) return payload.messages;
//     if (Array.isArray(payload.data)) return payload.data;
//     if (Array.isArray(payload.results)) return payload.results;
//     const maybe = payload?.data?.messages ?? payload?.messages ?? payload;
//     if (Array.isArray(maybe)) return maybe;
//     return [];
//   }

//   useEffect(() => {
//     let mounted = true;
//     const abortController = new AbortController();

//     async function loadChats() {
//       if (!selected?.id) {
//         setMessages([]);
//         return;
//       }
//       setLoading(true);
//       setError(null);

//       const endpoint = `/tickets/get/chats/${selected.id}/`;
//       try {
//         let data;
//         if (api && typeof api.get === "function") {
//           const headers = token ? { Authorization: `Bearer ${token}` } : {};
//           const res = await api.get(endpoint, {
//             headers,
//             signal: abortController.signal,
//           });
//           data = res?.data;
//         } else {
//           const res = await fetch(endpoint, {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             signal: abortController.signal,
//           });
//           if (!res.ok) throw new Error(`Failed to load chats (${res.status})`);
//           data = await res.json();
//         }

//         if (!mounted) return;
//         const raw = normalizeMessagesPayload(data);

//         const mapped = raw.map((m, i) => ({
//           id: m.id ?? m.message_id ?? `${m.at ?? Date.now()}_${i}`,
//           text: m.message ?? m.text ?? m.body ?? m.message_text ?? "",
//           at:
//             m.at ??
//             m.createdAt ??
//             m.created_at ??
//             m.timestamp ??
//             new Date().toISOString(),
//           from:
//             m.app_user_id ??
//             m.from ??
//             m.sender ??
//             m.email ??
//             m.username ??
//             "unknown",
//           status: "sent",
//         }));

//         setMessages(mapped);
//         requestAnimationFrame(scrollToBottom);
//       } catch (err) {
//         if (err.name === "AbortError") return;
//         console.error("Failed to load chats:", err);
//         setError(err.message || "Failed to load chats");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     loadChats();
//     return () => {
//       mounted = false;
//       abortController.abort();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selected?.id, token]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages.length]);

//   // helper: extract useful info from axios/fetch errors
//   function extractServerError(err) {
//     if (!err) return { title: "Request failed", body: String(err) };

//     if (err?.isAxiosError && err.response) {
//       const { status, data } = err.response;
//       const body = typeof data === "string" ? data : JSON.stringify(data);
//       return { title: `Server error (${status})`, body };
//     }

//     if (err?.response) {
//       const { status, data } = err.response;
//       const body = typeof data === "string" ? data : JSON.stringify(data);
//       return { title: `Server error (${status})`, body };
//     }

//     return { title: "Request failed", body: err.message ?? String(err) };
//   }

//   // single focused sender that sends the expected payload:
//   // { ticket_id, app_user_id, message }
//   async function postMessage(ticket_id, app_user_id, message) {
//     const endpoint = "/tickets/add-message/";
//     const payload = { ticket_id, app_user_id, message };

//     // warn if no app_user_id — backend may reject or require it
//     if (!app_user_id) {
//       console.warn(
//         "[ChatBox] app_user_id missing; sending empty string. Prefer setting user.app_user_id in AuthContext."
//       );
//     }

//     if (api && typeof api.post === "function") {
//       const headers = token ? { Authorization: `Bearer ${token}` } : {};
//       const res = await api.post(endpoint, payload, { headers });
//       return res?.data;
//     } else {
//       const res = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) {
//         const body = await res.text().catch(() => "");
//         const err = new Error(`Send failed (${res.status})`);
//         err.response = { status: res.status, data: body };
//         throw err;
//       }
//       return await res.json().catch(() => ({}));
//     }
//   }

//   // optimistic send handler
//   async function sendMessage(e) {
//     if (e && e.preventDefault) e.preventDefault();
//     setError(null);

//     const text = (msgText || "").trim();
//     if (!text || !selected?.id) return;

//     const ticket_id = selected.id;
//     const tempId = `tmp-${Date.now()}`;

//     const pendingMsg = {
//       id: tempId,
//       text,
//       at: new Date().toISOString(),
//       from: appUserId ?? userEmail ?? "me",
//       status: "pending",
//     };

//     setMessages((s) => [...s, pendingMsg]);
//     setMsgText("");
//     setSending(true);

//     try {
//       const respData = await postMessage(ticket_id, appUserId ?? "", text);

//       // server's response body example contains { ticket_id, app_user_id, message }
//       // server might return the created message object — normalize accordingly
//       let created = null;
//       if (!respData) {
//         created = {
//           id: `${ticket_id}-${Date.now()}`,
//           message: text,
//           app_user_id: appUserId ?? userEmail,
//         };
//       } else if (
//         respData.message &&
//         (respData.message === text || typeof respData.message === "string")
//       ) {
//         // the server returned an object with message field (maybe echo)
//         created = respData;
//       } else if (respData.id || respData.message_id) {
//         created = respData;
//       } else {
//         // fallback: treat top-level respData as created object
//         created = respData;
//       }

//       const mapped = {
//         id: created.id ?? created.message_id ?? `${ticket_id}-${Date.now()}`,
//         text: created.message ?? created.text ?? created.body ?? text,
//         at: created.at ?? created.created_at ?? new Date().toISOString(),
//         from:
//           created.app_user_id ??
//           created.appUserId ??
//           created.from ??
//           appUserId ??
//           userEmail,
//         status: "sent",
//       };

//       setMessages((s) => s.map((m) => (m.id === tempId ? mapped : m)));
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       // print full server response to console to help backend debugging
//       console.error("Failed to send message:", err);
//       if (err?.response) {
//         console.error("[ChatBox] server response:", err.response);
//       }

//       const info = extractServerError(err);
//       setError(info.title + ". See console for details.");

//       // mark the pending message as failed
//       setMessages((s) =>
//         s.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
//       );
//     } finally {
//       setSending(false);
//     }
//   }

//   // Retry uses same postMessage function
//   async function retryMessage(msg) {
//     if (!msg || msg.status !== "failed") return;
//     setMessages((s) =>
//       s.map((m) => (m.id === msg.id ? { ...m, status: "pending" } : m))
//     );
//     setError(null);

//     try {
//       const respData = await postMessage(
//         selected.id,
//         appUserId ?? "",
//         msg.text
//       );

//       const created = respData.message ?? respData;
//       const mapped = {
//         id: created.id ?? `msg-${Date.now()}`,
//         text: created.message ?? created.text ?? msg.text,
//         at: created.at ?? created.created_at ?? new Date().toISOString(),
//         from: created.app_user_id ?? appUserId ?? userEmail,
//         status: "sent",
//       };

//       setMessages((s) => s.map((m) => (m.id === msg.id ? mapped : m)));
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       console.error("Retry failed:", err);
//       if (err?.response)
//         console.error("[ChatBox] server response:", err.response);
//       setMessages((s) =>
//         s.map((m) => (m.id === msg.id ? { ...m, status: "failed" } : m))
//       );
//       setError("Retry failed. See console for details.");
//     }
//   }

//   return (
//     <motion.div
//       layout
//       className="lg:col-span-1 bg-white rounded shadow p-4 flex flex-col"
//     >
//       <div className="mb-3">
//         <h3 className="font-medium text-slate-800">Conversation</h3>
//         <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
//       </div>

//       {!selected ? (
//         <div className="p-6 text-sm text-slate-500">
//           No ticket selected. Select a ticket from the list on the right.
//         </div>
//       ) : (
//         <>
//           <motion.div layout className="border rounded p-3 mb-4">
//             <div className="text-sm font-semibold">
//               {selected.category || selected.categoryTitle || "Subject"}
//             </div>
//             <div className="text-xs text-slate-400 mt-1">
//               Ticket ID:{" "}
//               <span className="text-xs text-indigo-600">{selected.id}</span>
//             </div>
//             <div className="text-xs text-slate-400">
//               Priority:{" "}
//               <span className="inline-block ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
//                 Low
//               </span>
//             </div>
//           </motion.div>

//           <div
//             ref={containerRef}
//             className="space-y-3 max-h-[320px] overflow-auto mb-4 flex-1"
//           >
//             <motion.div
//               initial={{ opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-blue-600 text-white rounded p-3 text-sm"
//             >
//               Support — Welcome to HelpDesk! Your ticket is being routed, an
//               agent will join shortly.
//             </motion.div>

//             <AnimatePresence initial={false}>
//               {loading ? (
//                 <motion.div
//                   key="loading"
//                   className="text-sm text-slate-500 p-3"
//                 >
//                   Loading messages…
//                 </motion.div>
//               ) : null}

//               {messages.map((m) => (
//                 <motion.div
//                   key={m.id}
//                   variants={messageItem}
//                   initial="hidden"
//                   animate="visible"
//                   exit="exit"
//                   className={`p-3 rounded max-w-[90%] ${
//                     m.from === appUserId || m.from === userEmail
//                       ? "bg-slate-100 self-end ml-auto text-slate-800"
//                       : "bg-white border text-slate-800"
//                   }`}
//                 >
//                   <div className="text-sm">{m.text}</div>
//                   <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
//                     <span>{format(new Date(m.at), "PPpp")}</span>
//                     {m.status === "pending" && (
//                       <span className="text-xs text-amber-600">• Sending…</span>
//                     )}
//                     {m.status === "failed" && (
//                       <>
//                         <span className="text-xs text-red-600">• Failed</span>
//                         <button
//                           onClick={() => retryMessage(m)}
//                           className="ml-2 text-xs text-blue-600 underline"
//                         >
//                           Retry
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>

//             {messages.length === 0 && !loading && (
//               <div className="text-sm text-slate-400">No messages yet.</div>
//             )}
//           </div>

//           <form onSubmit={sendMessage} className="flex gap-2 items-center mt-2">
//             <input
//               className="flex-1 border px-3 py-2 rounded"
//               placeholder="Type a message..."
//               value={msgText}
//               onChange={(e) => setMsgText(e.target.value)}
//               disabled={sending}
//             />
//             <motion.button
//               whileTap={{ scale: 0.98 }}
//               type="submit"
//               disabled={sending}
//               className="bg-blue-600 text-white px-3 py-2 rounded"
//             >
//               {sending ? "Sending..." : "Send"}
//             </motion.button>
//           </form>

//           {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
//         </>
//       )}
//     </motion.div>
//   );
// }

// components/customer/ChatBox.jsx
// "use client";

// import { motion, AnimatePresence } from "framer-motion";
// import { format } from "date-fns";
// import React, { useEffect, useRef, useState } from "react";
// import { useAuth } from "@/context/AuthContext"; // adjust path if needed

// let api = null;
// try {
//   api = require("@/lib/axios").default;
// } catch (e) {
//   api = null;
// }

// export default function ChatBox({ selected, userEmail: propUserEmail }) {
//   const { token, user } = useAuth();
//   const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";

//   // Prefer explicit app_user_id; fallback to id if server uses that
//   const appUserId =
//     user?.app_user_id ??
//     user?.appUserId ??
//     user?.user_id ??
//     user?.id ??
//     user?.uid ??
//     user?.pk ??
//     null;

//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [msgText, setMsgText] = useState("");
//   const [error, setError] = useState(null);

//   // server response debugging
//   const [serverResponseSnippet, setServerResponseSnippet] = useState(null);
//   const [showServerResponse, setShowServerResponse] = useState(false);

//   const containerRef = useRef(null);

//   function scrollToBottom() {
//     try {
//       const el = containerRef.current;
//       if (!el) return;
//       el.scrollTop = el.scrollHeight;
//     } catch (e) {}
//   }

//   function normalizeMessagesPayload(payload) {
//     if (!payload) return [];
//     if (Array.isArray(payload)) return payload;
//     if (Array.isArray(payload.messages)) return payload.messages;
//     if (Array.isArray(payload.data)) return payload.data;
//     if (Array.isArray(payload.results)) return payload.results;
//     const maybe = payload?.data?.messages ?? payload?.messages ?? payload;
//     if (Array.isArray(maybe)) return maybe;
//     return [];
//   }

//   useEffect(() => {
//     let mounted = true;
//     const ac = new AbortController();
//     async function loadChats() {
//       if (!selected?.id) {
//         setMessages([]);
//         return;
//       }
//       setLoading(true);
//       setError(null);
//       setServerResponseSnippet(null);

//       const endpoint = `/tickets/get/chats/${selected.id}/`;
//       try {
//         let data;
//         if (api && typeof api.get === "function") {
//           const headers = token ? { Authorization: `Bearer ${token}` } : {};
//           const res = await api.get(endpoint, {
//             headers,
//             signal: ac.signal,
//             withCredentials: true,
//           });
//           data = res?.data;
//         } else {
//           const res = await fetch(endpoint, {
//             method: "GET",
//             headers: {
//               "Content-Type": "application/json",
//               ...(token ? { Authorization: `Bearer ${token}` } : {}),
//             },
//             signal: ac.signal,
//             credentials: "include",
//           });
//           if (!res.ok) throw new Error(`Failed to load chats (${res.status})`);
//           data = await res.json();
//         }

//         if (!mounted) return;
//         const raw = normalizeMessagesPayload(data);
//         const mapped = raw.map((m, i) => ({
//           id: m.id ?? m.message_id ?? `${m.at ?? Date.now()}_${i}`,
//           text: m.message ?? m.text ?? m.body ?? "",
//           at: m.at ?? m.createdAt ?? m.created_at ?? new Date().toISOString(),
//           from: m.app_user_id ?? m.from ?? m.sender ?? m.email ?? "unknown",
//           status: "sent",
//         }));

//         setMessages(mapped);
//         requestAnimationFrame(scrollToBottom);
//       } catch (err) {
//         if (err.name === "AbortError") return;
//         console.error("Failed to load chats:", err);
//         setError(err.message || "Failed to load chats");
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     loadChats();
//     return () => {
//       mounted = false;
//       ac.abort();
//     };
//   }, [selected?.id, token]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages.length]);

//   // sends payload exactly as your backend expects
//   async function postMessage(ticket_id, app_user_id, message) {
//     const endpoint = "/tickets/add-message/";
//     const payload = { ticket_id, app_user_id, message };

//     // Log request for debugging
//     console.info("[ChatBox] POST", endpoint, {
//       payload,
//       tokenPresent: !!token,
//       app_user_id,
//     });

//     if (api && typeof api.post === "function") {
//       // axios
//       const headers = token
//         ? {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           }
//         : { "Content-Type": "application/json" };
//       const res = await api.post(endpoint, payload, {
//         headers,
//         withCredentials: true,
//       });
//       return res?.data;
//     } else {
//       const res = await fetch(endpoint, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         credentials: "include",
//         body: JSON.stringify(payload),
//       });
//       if (!res.ok) {
//         const body = await res.text().catch(() => "");
//         const err = new Error(`Send failed (${res.status})`);
//         err.response = { status: res.status, data: body };
//         throw err;
//       }
//       return await res.json().catch(() => ({}));
//     }
//   }

//   async function sendMessage(e) {
//     if (e && e.preventDefault) e.preventDefault();
//     setError(null);
//     setServerResponseSnippet(null);

//     const text = (msgText || "").trim();
//     if (!text || !selected?.id) return;

//     // WARNING: server requires app_user_id — if missing, be explicit
//     if (!appUserId) {
//       console.warn(
//         "[ChatBox] app_user_id is missing. Backend may reject this request."
//       );
//     }

//     const ticket_id = selected.id;
//     const tempId = `tmp-${Date.now()}`;

//     const pendingMsg = {
//       id: tempId,
//       text,
//       at: new Date().toISOString(),
//       from: appUserId ?? userEmail,
//       status: "pending",
//     };
//     setMessages((s) => [...s, pendingMsg]);
//     setMsgText("");
//     setSending(true);

//     try {
//       const resp = await postMessage(ticket_id, appUserId ?? "", text);

//       // map server response
//       let created = null;
//       if (!resp)
//         created = {
//           id: `${ticket_id}-${Date.now()}`,
//           message: text,
//           app_user_id: appUserId ?? userEmail,
//         };
//       else if (resp.message && typeof resp.message === "string") created = resp;
//       else if (resp.id || resp.message_id) created = resp;
//       else created = resp;

//       const mapped = {
//         id: created.id ?? created.message_id ?? `${ticket_id}-${Date.now()}`,
//         text: created.message ?? created.text ?? created.body ?? text,
//         at: created.at ?? created.created_at ?? new Date().toISOString(),
//         from: created.app_user_id ?? appUserId ?? userEmail,
//         status: "sent",
//       };

//       setMessages((s) => s.map((m) => (m.id === tempId ? mapped : m)));
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       console.error("Failed to send message:", err);

//       // capture server snippet for debugging
//       let snippet = null;
//       if (err?.isAxiosError && err.response) {
//         snippet =
//           typeof err.response.data === "string"
//             ? err.response.data
//             : JSON.stringify(err.response.data, null, 2);
//       } else if (err?.response) {
//         snippet =
//           typeof err.response.data === "string"
//             ? err.response.data
//             : JSON.stringify(err.response.data, null, 2);
//       } else {
//         snippet = err.message ?? String(err);
//       }
//       setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
//       setError(
//         `Failed to send message. Server returned error (see console or "Show response").`
//       );

//       setMessages((s) =>
//         s.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
//       );
//     } finally {
//       setSending(false);
//     }
//   }

//   async function retryMessage(msg) {
//     if (!msg || msg.status !== "failed") return;
//     setMessages((s) =>
//       s.map((m) => (m.id === msg.id ? { ...m, status: "pending" } : m))
//     );
//     setError(null);
//     setServerResponseSnippet(null);

//     try {
//       const resp = await postMessage(selected.id, appUserId ?? "", msg.text);
//       const created = resp.message ?? resp;
//       const mapped = {
//         id: created.id ?? `msg-${Date.now()}`,
//         text: created.message ?? created.text ?? msg.text,
//         at: created.at ?? created.created_at ?? new Date().toISOString(),
//         from: created.app_user_id ?? appUserId ?? userEmail,
//         status: "sent",
//       };
//       setMessages((s) => s.map((m) => (m.id === msg.id ? mapped : m)));
//       requestAnimationFrame(scrollToBottom);
//     } catch (err) {
//       console.error("Retry failed:", err);
//       let snippet = null;
//       if (err?.response)
//         snippet =
//           typeof err.response.data === "string"
//             ? err.response.data
//             : JSON.stringify(err.response.data, null, 2);
//       setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
//       setError("Retry failed. See server response.");
//       setMessages((s) =>
//         s.map((m) => (m.id === msg.id ? { ...m, status: "failed" } : m))
//       );
//     }
//   }

//   return (
//     <motion.div
//       layout
//       className="lg:col-span-1 bg-white rounded shadow p-4 flex flex-col"
//     >
//       <div className="mb-3">
//         <h3 className="font-medium text-slate-800">Conversation</h3>
//         <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
//       </div>

//       {!selected ? (
//         <div className="p-6 text-sm text-slate-500">
//           No ticket selected. Select a ticket from the list on the right.
//         </div>
//       ) : (
//         <>
//           <motion.div layout className="border rounded p-3 mb-4">
//             <div className="text-sm font-semibold">
//               {selected.category || selected.categoryTitle || "Subject"}
//             </div>
//             <div className="text-xs text-slate-400 mt-1">
//               Ticket ID:{" "}
//               <span className="text-xs text-indigo-600">{selected.id}</span>
//             </div>
//             <div className="text-xs text-slate-400">
//               Priority:{" "}
//               <span className="inline-block ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
//                 Low
//               </span>
//             </div>
//           </motion.div>

//           <div
//             ref={containerRef}
//             className="space-y-3 max-h-[320px] overflow-auto mb-4 flex-1"
//           >
//             <motion.div
//               initial={{ opacity: 0, y: 6 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="bg-blue-600 text-white rounded p-3 text-sm"
//             >
//               Support — Welcome to HelpDesk! Your ticket is being routed, an
//               agent will join shortly.
//             </motion.div>

//             <AnimatePresence initial={false}>
//               {loading ? (
//                 <motion.div
//                   key="loading"
//                   className="text-sm text-slate-500 p-3"
//                 >
//                   Loading messages…
//                 </motion.div>
//               ) : null}

//               {messages.map((m) => (
//                 <motion.div
//                   key={m.id}
//                   variants={{
//                     hidden: { opacity: 0, y: 6 },
//                     visible: { opacity: 1, y: 0 },
//                     exit: { opacity: 0, y: -6 },
//                   }}
//                   initial="hidden"
//                   animate="visible"
//                   exit="exit"
//                   className={`p-3 rounded max-w-[90%] ${
//                     m.from === appUserId || m.from === userEmail
//                       ? "bg-slate-100 self-end ml-auto text-slate-800"
//                       : "bg-white border text-slate-800"
//                   }`}
//                 >
//                   <div className="text-sm">{m.text}</div>
//                   <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
//                     <span>{format(new Date(m.at), "PPpp")}</span>
//                     {m.status === "pending" && (
//                       <span className="text-xs text-amber-600">• Sending…</span>
//                     )}
//                     {m.status === "failed" && (
//                       <>
//                         <span className="text-xs text-red-600">• Failed</span>
//                         <button
//                           onClick={() => retryMessage(m)}
//                           className="ml-2 text-xs text-blue-600 underline"
//                         >
//                           Retry
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 </motion.div>
//               ))}
//             </AnimatePresence>

//             {messages.length === 0 && !loading && (
//               <div className="text-sm text-slate-400">No messages yet.</div>
//             )}
//           </div>

//           <form onSubmit={sendMessage} className="flex gap-2 items-center mt-2">
//             <input
//               className="flex-1 border px-3 py-2 rounded"
//               placeholder="Type a message..."
//               value={msgText}
//               onChange={(e) => setMsgText(e.target.value)}
//               disabled={sending}
//             />
//             <motion.button
//               whileTap={{ scale: 0.98 }}
//               type="submit"
//               disabled={sending}
//               className="bg-blue-600 text-white px-3 py-2 rounded"
//             >
//               {sending ? "Sending..." : "Send"}
//             </motion.button>
//           </form>

//           {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

//           {/* Debug UI: show server response snippet to copy to backend logs */}
//           {serverResponseSnippet && (
//             <div className="mt-2 text-xs">
//               <button
//                 onClick={() => setShowServerResponse((s) => !s)}
//                 className="underline text-blue-600"
//               >
//                 {showServerResponse
//                   ? "Hide server response"
//                   : "Show server response (debug)"}
//               </button>
//               {showServerResponse && (
//                 <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs max-h-40">
//                   {serverResponseSnippet}
//                 </pre>
//               )}
//             </div>
//           )}
//         </>
//       )}
//     </motion.div>
//   );
// }

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

let api = null;
try {
  api = require("@/lib/axios").default;
} catch (e) {
  api = null;
}

export default function ChatBox({ selected, userEmail: propUserEmail }) {
  const { token, user } = useAuth();
  const userEmail = propUserEmail ?? user?.email ?? user?.username ?? "me";

  const appUserId =
    user?.app_user_id ??
    user?.appUserId ??
    user?.user_id ??
    user?.id ??
    user?.uid ??
    user?.pk ??
    null;

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [error, setError] = useState(null);
  const [serverResponseSnippet, setServerResponseSnippet] = useState(null);
  const [showServerResponse, setShowServerResponse] = useState(false);

  const containerRef = useRef(null);

  function scrollToBottom() {
    try {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }

  function normalizeMessagesPayload(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.messages)) return payload.messages;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
    const maybe = payload?.data?.messages ?? payload?.messages ?? payload;
    if (Array.isArray(maybe)) return maybe;
    return [];
  }

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function loadChats() {
      if (!selected?.id) {
        setMessages([]);
        return;
      }
      setLoading(true);
      setError(null);
      setServerResponseSnippet(null);

      const endpoint = `/tickets/get/chats/${selected.id}/`;
      try {
        let data;
        if (api && typeof api.get === "function") {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await api.get(endpoint, { headers, signal: ac.signal });
          data = res?.data;
        } else {
          const res = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: ac.signal,
          });
          if (!res.ok) throw new Error(`Failed to load chats (${res.status})`);
          data = await res.json();
        }

        if (!mounted) return;
        const raw = normalizeMessagesPayload(data);
        const mapped = raw.map((m, i) => ({
          id: m.id ?? m.message_id ?? `${m.at ?? Date.now()}_${i}`,
          text: m.message ?? m.text ?? m.body ?? m.message_text ?? "",
          at:
            m.at ??
            m.createdAt ??
            m.created_at ??
            m.timestamp ??
            new Date().toISOString(),
          from: m.app_user_id ?? m.from ?? m.sender ?? m.email ?? "unknown",
          status: "sent",
        }));

        setMessages(mapped);
        requestAnimationFrame(scrollToBottom);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load chats:", err);
        setError(err.message || "Failed to load chats");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadChats();

    return () => {
      mounted = false;
      ac.abort();
    };
  }, [selected?.id, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  async function postMessage(ticket_id, app_user_id, message) {
    const endpoint = "/tickets/add-message/";
    const payload = { ticket_id, app_user_id, message };

    if (api && typeof api.post === "function") {
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        : { "Content-Type": "application/json" };
      const res = await api.post(endpoint, payload, { headers });
      return res?.data;
    } else {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = new Error(`Send failed (${res.status})`);
        err.response = { status: res.status, data: body };
        throw err;
      }
      return await res.json().catch(() => ({}));
    }
  }

  async function sendMessage(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    setServerResponseSnippet(null);

    const text = (msgText || "").trim();
    if (!text || !selected?.id) return;

    if (!appUserId) {
      console.warn("[ChatBox] app_user_id missing; backend may require it.");
    }

    const ticket_id = selected.id;
    const tempId = `tmp-${Date.now()}`;

    const pendingMsg = {
      id: tempId,
      text,
      at: new Date().toISOString(),
      from: appUserId ?? userEmail,
      status: "pending",
    };
    setMessages((s) => [...s, pendingMsg]);
    setMsgText("");
    setSending(true);

    try {
      const resp = await postMessage(ticket_id, appUserId ?? "", text);

      let created = null;
      if (!resp)
        created = {
          id: `${ticket_id}-${Date.now()}`,
          message: text,
          app_user_id: appUserId ?? userEmail,
        };
      else if (resp.message && typeof resp.message === "string") created = resp;
      else if (resp.id || resp.message_id) created = resp;
      else created = resp;

      const mapped = {
        id: created.id ?? created.message_id ?? `${ticket_id}-${Date.now()}`,
        text: created.message ?? created.text ?? created.body ?? text,
        at: created.at ?? created.created_at ?? new Date().toISOString(),
        from: created.app_user_id ?? appUserId ?? userEmail,
        status: "sent",
      };

      setMessages((s) => s.map((m) => (m.id === tempId ? mapped : m)));
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      console.error("Failed to send message:", err);
      let snippet = null;
      if (err?.isAxiosError && err.response) {
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      } else if (err?.response) {
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      } else {
        snippet = err.message ?? String(err);
      }
      setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
      setError(
        `Failed to send message. Server returned error (see console or "Show response").`
      );
      setMessages((s) =>
        s.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
      );
    } finally {
      setSending(false);
    }
  }

  async function retryMessage(msg) {
    if (!msg || msg.status !== "failed") return;
    setMessages((s) =>
      s.map((m) => (m.id === msg.id ? { ...m, status: "pending" } : m))
    );
    setError(null);
    setServerResponseSnippet(null);

    try {
      const resp = await postMessage(selected.id, appUserId ?? "", msg.text);
      const created = resp.message ?? resp;
      const mapped = {
        id: created.id ?? `msg-${Date.now()}`,
        text: created.message ?? created.text ?? msg.text,
        at: created.at ?? created.created_at ?? new Date().toISOString(),
        from: created.app_user_id ?? appUserId ?? userEmail,
        status: "sent",
      };
      setMessages((s) => s.map((m) => (m.id === msg.id ? mapped : m)));
      requestAnimationFrame(scrollToBottom);
    } catch (err) {
      console.error("Retry failed:", err);
      let snippet = null;
      if (err?.response)
        snippet =
          typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data, null, 2);
      setServerResponseSnippet(snippet?.slice?.(0, 5000) ?? String(snippet));
      setError("Retry failed. See server response.");
      setMessages((s) =>
        s.map((m) => (m.id === msg.id ? { ...m, status: "failed" } : m))
      );
    }
  }

  return (
    <motion.div
      layout
      className="lg:col-span-1 bg-white rounded shadow p-4 flex flex-col"
    >
      <div className="mb-3">
        <h3 className="font-medium text-slate-800">Conversation</h3>
        <p className="text-xs text-slate-500">Selected ticket chat & replies</p>
      </div>

      {!selected ? (
        <div className="p-6 text-sm text-slate-500">
          No ticket selected. Select a ticket from the list on the right.
        </div>
      ) : (
        <>
          <motion.div layout className="border rounded p-3 mb-4">
            <div className="text-sm font-semibold">
              {selected.category || selected.categoryTitle || "Subject"}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Ticket ID:{" "}
              <span className="text-xs text-indigo-600">{selected.id}</span>
            </div>
            <div className="text-xs text-slate-400">
              Priority:{" "}
              <span className="inline-block ml-2 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                Low
              </span>
            </div>
          </motion.div>

          <div
            ref={containerRef}
            className="space-y-3 max-h-[320px] overflow-auto mb-4 flex-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-600 text-white rounded p-3 text-sm"
            >
              Support — Welcome to HelpDesk! Your ticket is being routed, an
              agent will join shortly.
            </motion.div>

            <AnimatePresence initial={false}>
              {loading ? (
                <motion.div
                  key="loading"
                  className="text-sm text-slate-500 p-3"
                >
                  Loading messages…
                </motion.div>
              ) : null}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -6 },
                  }}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`p-3 rounded max-w-[90%] ${
                    m.from === appUserId || m.from === userEmail
                      ? "bg-slate-100 self-end ml-auto text-slate-800"
                      : "bg-white border text-slate-800"
                  }`}
                >
                  <div className="text-sm">{m.text}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <span>{format(new Date(m.at), "PPpp")}</span>
                    {m.status === "pending" && (
                      <span className="text-xs text-amber-600">• Sending…</span>
                    )}
                    {m.status === "failed" && (
                      <>
                        <span className="text-xs text-red-600">• Failed</span>
                        <button
                          onClick={() => retryMessage(m)}
                          className="ml-2 text-xs text-blue-600 underline"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {messages.length === 0 && !loading && (
              <div className="text-sm text-slate-400">No messages yet.</div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 items-center mt-2">
            <input
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Type a message..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              disabled={sending}
            />
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={sending}
              className="bg-blue-600 text-white px-3 py-2 rounded"
            >
              {sending ? "Sending..." : "Send"}
            </motion.button>
          </form>

          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

          {serverResponseSnippet && (
            <div className="mt-2 text-xs">
              <button
                onClick={() => setShowServerResponse((s) => !s)}
                className="underline text-blue-600"
              >
                {showServerResponse
                  ? "Hide server response"
                  : "Show server response (debug)"}
              </button>
              {showServerResponse && (
                <pre className="mt-2 p-2 bg-slate-100 rounded overflow-auto text-xs max-h-40">
                  {serverResponseSnippet}
                </pre>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
