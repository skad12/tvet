"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isValid } from "date-fns";
import api from "@/lib/axios";

export default function TicketsList({
  categoryId,
  statusFilter = "all",
  onSelectTicket,
  selectedTicketId,
  pageSize = 11,
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // pagination control (start and stop are inclusive)
  const [start, setStart] = useState(0);
  const [stop, setStop] = useState(pageSize - 1);
  const [hasMore, setHasMore] = useState(false);

  // Ref for infinite scroll observer
  const observerTarget = useRef(null);

  // reset pagination on category or status change
  useEffect(() => {
    setStart(0);
    setStop(pageSize - 1);
    setTickets([]);
  }, [categoryId, statusFilter, pageSize]);

  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    async function load() {
      // Use loading for initial load, loadingMore for subsequent loads
      if (start === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      // Use loading for initial load, loadingMore for subsequent loads
      if (start === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        let resData = null;
        let usingFallback = false;
        let totalCount = null;

        // Primary endpoint: category-based paginated route
        const categoryBasedUrl = `/tickets/category-based/${start}/${stop}/`;
        const genericPagedUrl = `/tickets/${start}/${stop}/`;

        // Payload to send (API expects start & stop; include category if present)
        const payload = { start: Number(start), stop: Number(stop) };
        if (categoryId !== null && categoryId !== undefined)
          payload.category = categoryId;

        console.log("[TicketsList] Loading tickets:", {
          start,
          stop,
          categoryId,
          payload,
        });

        // Try GET requests to paginated endpoints first
        try {
          if (categoryId !== null && categoryId !== undefined) {
            console.log(
              "[TicketsList] Trying category-based endpoint:",
              categoryBasedUrl
            );
            const res = await api.get(
              categoryBasedUrl + (categoryId ? `?category=${categoryId}` : ""),
              { signal: ac.signal }
            );
            resData = res?.data ?? null;
            console.log("[TicketsList] Category-based endpoint response:", {
              dataType: typeof resData,
              isArray: Array.isArray(resData),
              length: Array.isArray(resData) ? resData.length : resData?.length,
              hasTotal: "total" in (resData || {}),
              hasCount: "count" in (resData || {}),
              total: resData?.total,
              count: resData?.count,
            });
          } else {
            console.log(
              "[TicketsList] Trying generic paged endpoint:",
              genericPagedUrl
            );
            const res = await api.get(genericPagedUrl, {
              signal: ac.signal,
            });
            resData = res?.data ?? null;
            console.log("[TicketsList] Generic paged endpoint response:", {
              dataType: typeof resData,
              isArray: Array.isArray(resData),
              length: Array.isArray(resData) ? resData.length : resData?.length,
              hasTotal: "total" in (resData || {}),
              hasCount: "count" in (resData || {}),
              total: resData?.total,
              count: resData?.count,
            });
          }
        } catch (getErr) {
          console.log(
            "[TicketsList] Paginated endpoints failed:",
            getErr?.message
          );
          // final fallback: fetch all and (optionally) filter by category client-side
          console.log("[TicketsList] Using fallback - fetching all tickets");
          usingFallback = true;
          const res3 = await api
            .get("/tickets/", { signal: ac.signal })
            .catch(() => null);
          const all = res3?.data ?? [];
          const arr = Array.isArray(all)
            ? all
            : all?.tickets ?? all?.results ?? [];
          const filtered = categoryId
            ? arr.filter((t) => {
                // Check the ticket's name field which contains the category title
                const categoryName =
                  t?.name ??
                  t?.category?.name ??
                  t?.category_name ??
                  t?.categoryTitle ??
                  t?.category_title ??
                  t?.category ??
                  null;
                return (
                  categoryName !== null &&
                  String(categoryName).toLowerCase() ===
                    String(categoryId).toLowerCase()
                );
              })
            : arr;
          // Store total count before slicing
          totalCount = filtered.length;
          // simulate pagination on client side
          const paged = filtered.slice(start, stop + 1);
          resData = paged;
          console.log("[TicketsList] Fallback result:", {
            totalTickets: totalCount,
            pagedTickets: paged.length,
            start,
            stop,
          });
        }

        if (!mounted) return;

        // Normalize to array
        let arr = [];
        if (!resData) arr = [];
        else if (Array.isArray(resData)) arr = resData;
        else if (Array.isArray(resData.results)) arr = resData.results;
        else if (Array.isArray(resData.data)) arr = resData.data;
        else if (Array.isArray(resData.tickets)) arr = resData.tickets;
        else arr = [resData];

        // Determine hasMore:
        // If we got fewer items than pageSize, we've reached the end
        // If we got exactly pageSize items, there might be more
        if (usingFallback && typeof totalCount === "number") {
          // Using client-side pagination - check if there are more items after current stop
          const hasMoreItems = totalCount > stop + 1;
          setHasMore(hasMoreItems);
          console.log("[TicketsList] hasMore (fallback):", {
            totalCount,
            stop,
            nextStart: stop + 1,
            hasMore: hasMoreItems,
          });
        } else {
          const totalMaybe = resData?.total ?? resData?.count ?? null;
          if (typeof totalMaybe === "number") {
            const nextStart = stop + 1;
            setHasMore(totalMaybe > nextStart);
          } else if (resData?.next) {
            setHasMore(true);
          } else {
            // No total/count available - keep fetching until we get very few or no items
            // This handles APIs that don't provide a total count
            const hasMoreItems = arr.length > 0;
            setHasMore(hasMoreItems);
            console.log("[TicketsList] hasMore (API - no count):", {
              arrLength: arr.length,
              pageSize,
              hasMore: hasMoreItems,
              note: "Will keep fetching until 0 items returned",
            });
          }
        }

        // Helper function to normalize status values
        function normalizeStatus(status) {
          if (!status) return "active";
          const s = String(status).toLowerCase().trim();
          if (s === "resolved" || s === "closed" || s === "completed")
            return "resolved";
          if (s === "pending" || s === "waiting" || s === "in_progress")
            return "pending";
          if (s === "active" || s === "open" || s === "new") return "active";
          return s;
        }

        // Normalize tickets to expected shape
        const normalized = arr.map((t) => ({
          id: t?.id ?? t?.ticket_id ?? null,
          name: t?.name ?? t?.subject ?? t?.title ?? "From Widget",
          chats: Array.isArray(t?.chats) ? t.chats : t?.messages ?? [],
          email: t?.email ?? t?.user_email ?? "",
          subject: t?.subject ?? t?.title ?? "",
          status: normalizeStatus(
            t?.status ?? t?.state ?? t?.ticket_status ?? "active"
          ),
          escalated: t?.escalated === true || t?.priority === "high",
          created_at: t?.created_at ?? t?.created_on ?? t?.createdAt ?? null,
          created_at_display: t?.created_at_display ?? null,
          raw: t,
        }));

        // if start == 0 -> replace list, else append
        setTickets((prev) =>
          start === 0 ? normalized : [...prev, ...normalized]
        );
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.message === "canceled";
        if (isCanceled) return;
        console.error("Failed to load tickets:", err);
        setError(err?.message ?? "Failed to load tickets");
        setTickets([]);
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, [categoryId, start, stop, pageSize]);

  // Apply status filter to displayed tickets (client-side filtering after load)
  const displayedTickets = React.useMemo(() => {
    if (!statusFilter || statusFilter === "all") return tickets;

    function normalizeStatus(status) {
      if (!status) return "active";
      const s = String(status).toLowerCase().trim();
      if (s === "resolved" || s === "closed" || s === "completed")
        return "resolved";
      if (s === "pending" || s === "waiting" || s === "in_progress")
        return "pending";
      if (s === "active" || s === "open" || s === "new") return "active";
      return s;
    }

    return tickets.filter((t) => {
      const ticketStatus = normalizeStatus(t.status);
      return ticketStatus === statusFilter.toLowerCase();
    });
  }, [tickets, statusFilter]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore) return;

    const nextStart = stop + 1;
    const nextStop = nextStart + (pageSize - 1);
    setStart(nextStart);
    setStop(nextStop);
  }, [loadingMore, loading, hasMore, stop, pageSize]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Trigger 100px before the target is visible
      }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  function formatDate(val, display) {
    if (display) return display;
    if (!val) return "—";
    const dt = new Date(val);
    if (isValid(dt)) return format(dt, "PPpp");
    try {
      return String(val).slice(0, 32);
    } catch {
      return "—";
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">
          {categoryId ? `Tickets in Category ${categoryId}` : "All Tickets"}
          {statusFilter !== "all" &&
            ` - ${
              statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
            }`}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {loading
            ? "Loading..."
            : `${displayedTickets.length} ticket${
                displayedTickets.length === 1 ? "" : "s"
              }`}
        </p>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <span>Loading tickets...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : displayedTickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <div className="text-4xl mb-2">📋</div>
            <p>
              No tickets found
              {categoryId ? ` in category "${categoryId}"` : ""}
              {statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}
            </p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              <AnimatePresence>
                {displayedTickets.map((ticket, idx) => {
                  const isSelected = selectedTicketId === ticket.id;
                  return (
                    <motion.li
                      key={ticket.id ?? idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      onClick={() => onSelectTicket?.(ticket)}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-800 truncate">
                              {ticket.name || ticket.subject || "From Widget"}
                            </h4>
                            {ticket.escalated &&
                              String(ticket.status || "").toLowerCase() !==
                                "resolved" && (
                                <svg
                                  className="w-4 h-4 text-red-600 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  aria-label="Escalated"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                          </div>
                          {ticket.email && (
                            <p className="text-xs text-slate-500 truncate">
                              {ticket.email}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(
                              ticket.created_at,
                              ticket.created_at_display
                            )}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === "resolved"
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : ticket.status === "escalated"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : ticket.status === "pending"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {ticket.status || "active"}
                          </span>
                          {ticket.escalated &&
                            String(ticket.status || "").toLowerCase() !==
                              "resolved" && (
                              <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  aria-hidden
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Escalated
                              </span>
                            )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            {/* Infinite scroll trigger */}
            <div
              ref={observerTarget}
              className="p-4 border-t border-slate-100 text-center"
            >
              {loadingMore && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  <span>Loading more tickets...</span>
                </div>
              )}
              {!loadingMore && !hasMore && displayedTickets.length > 0 && (
                <span className="text-xs text-slate-400">No more tickets</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
