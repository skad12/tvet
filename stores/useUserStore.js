// stores/useUserStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/axios";

/**
 * Unified store for user authentication and tickets state management
 *
 * user shape: { id, name, email, role }  // role: 'admin'|'agent'|'customer'
 * Persist only `user` and `token` (token in session storage for security).
 * Tickets are not persisted - fetched fresh on each session.
 */
export const useUserStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      token: null,
      loading: false,
      error: null,

      // Tickets state
      tickets: [],
      ticketsLoading: false,
      ticketsError: null,
      lastTicketRefresh: null,

      // User actions
      setUser: (user) => {
        set({ user, error: null });
        if (typeof window !== "undefined") {
          try {
            if (user) {
              localStorage.setItem("user", JSON.stringify(user));
              const role =
                user.account_type ?? user.role ?? user.type ?? user.accountType;
              if (role) {
                localStorage.setItem("account_type", String(role));
              } else {
                localStorage.removeItem("account_type");
              }
            } else {
              localStorage.removeItem("user");
              localStorage.removeItem("account_type");
            }
          } catch (err) {
            console.warn("[useUserStore] Failed to persist user:", err);
          }
        }
      },
      setToken: (token) => {
        set({ token });
        // Also store token in localStorage for axios interceptor
        if (typeof window !== "undefined") {
          if (token) {
            localStorage.setItem("token", token);
          } else {
            localStorage.removeItem("token");
          }
        }
      },
      clearUser: () => {
        set({
          user: null,
          token: null,
          tickets: [],
          ticketsError: null,
          ticketsLoading: false,
          lastTicketRefresh: null,
        });
        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("account_type");
          localStorage.removeItem("tvet_user_email");
        }
      },
      setLoading: (val) => set({ loading: val }),
      setError: (err) => set({ error: err }),

      // Tickets actions
      setTickets: (tickets) =>
        set({ tickets, ticketsError: null, lastTicketRefresh: Date.now() }),
      addTicket: (ticket) => {
        const currentTickets = get().tickets;
        // Check if ticket already exists (by id)
        const exists = currentTickets.some(
          (t) =>
            (t.id && ticket.id && t.id === ticket.id) ||
            (t._id && ticket._id && t._id === ticket._id)
        );
        if (!exists) {
          set({
            tickets: [ticket, ...currentTickets],
            lastTicketRefresh: Date.now(),
          });
        }
      },
      updateTicket: (ticketId, updates) => {
        const tickets = get().tickets.map((t) => {
          const id = t.id ?? t._id;
          if (String(id) === String(ticketId)) {
            return { ...t, ...updates };
          }
          return t;
        });
        set({ tickets, lastTicketRefresh: Date.now() });
      },
      removeTicket: (ticketId) => {
        const tickets = get().tickets.filter((t) => {
          const id = t.id ?? t._id;
          return String(id) !== String(ticketId);
        });
        set({ tickets, lastTicketRefresh: Date.now() });
      },
      setTicketsLoading: (val) => set({ ticketsLoading: val }),
      setTicketsError: (err) => set({ ticketsError: err }),

      // Fetch tickets (optionally scoped by user id) and cache them
      fetchTickets: async (opts = {}) => {
        const { userId = null, start = null, stop = null } = opts || {};
        const current = get();
        if (!api || typeof api.get !== "function") {
          return current.tickets || [];
        }
        set({ ticketsLoading: true, ticketsError: null });
        try {
          let data;
          if (userId) {
            // Filter tickets by user id - use GET method
            try {
              const res = await api.get(`/filter-ticket/by-user-id/${userId}/`);
              data = res?.data;
            } catch (err) {
              // Fallback: try with query param if path param fails
              if (
                err?.response?.status === 404 ||
                err?.response?.status === 405
              ) {
                const res = await api.get(`/filter-ticket/by-user-id/`, {
                  params: { id: userId },
                });
                data = res?.data;
              } else {
                throw err;
              }
            }
          } else if (start !== null && stop !== null) {
            const res = await api.post(`/tickets/${start}/${stop}/`, {
              start,
              stop,
            });
            data = res?.data;
          } else {
            const res = await api.get("/tickets/");
            data = res?.data;
          }

          const all = Array.isArray(data)
            ? data
            : data?.tickets ?? data?.results ?? [];
          set({
            tickets: all,
            ticketsLoading: false,
            ticketsError: null,
            lastTicketRefresh: Date.now(),
          });
          return all;
        } catch (err) {
          set({
            ticketsLoading: false,
            ticketsError: err?.message || "Failed to load tickets",
          });
          return [];
        }
      },

      // Fetch only if cache empty or stale
      fetchTicketsIfNeeded: async (opts = {}) => {
        const {
          ttlMs = 60000,
          force = false,
          userId = null,
          start = null,
          stop = null,
        } = opts || {};
        const last = get().lastTicketRefresh || 0;
        const hasAny = Array.isArray(get().tickets) && get().tickets.length > 0;
        const isStale = Date.now() - last > ttlMs;
        if (force || !hasAny || isStale) {
          return await get().fetchTickets({ userId, start, stop });
        }
        return get().tickets || [];
      },

      // Helper functions
      isLoggedIn: () => !!get().user,
      hasAnyRole: (roles) => {
        const u = get().user;
        if (!u) return false;
        if (!roles) return false;
        const arr = Array.isArray(roles) ? roles : [roles];
        const userRole = u.role ?? u.account_type ?? u.type;
        return arr.includes(userRole);
      },

      // Get user ID from various possible fields
      getUserId: () => {
        const u = get().user;
        if (!u) return null;
        return (
          u.app_user_id ??
          u.appUserId ??
          u.user_id ??
          u.userId ??
          u.id ??
          u.uid ??
          u.pk ??
          null
        );
      },

      // Get user email from various possible fields
      getUserEmail: () => {
        const u = get().user;
        if (!u) return "";
        return (
          u.email ??
          u.username ??
          (Array.isArray(u.emails) ? u.emails[0] : "") ??
          ""
        );
      },

      // Get user role/account type
      getUserRole: () => {
        const u = get().user;
        if (!u) return null;
        return u.role ?? u.account_type ?? u.type ?? null;
      },
    }),
    {
      name: "tvet_user_store", // localStorage key
      partialize: (state) => ({
        user: state.user,
        // Don't persist token in localStorage, only in session
      }),
    }
  )
);
