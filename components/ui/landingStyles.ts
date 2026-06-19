/** Shared class tokens aligned with the marketing / landing page UI. */

export const landing = {
  card: "landing-card",
  panel: "landing-panel",
  eyebrow: "landing-eyebrow",
  title: "text-2xl sm:text-3xl font-bold tracking-tight text-foreground",
  subtitle: "text-sm text-muted mt-1",
  sectionTitle: "text-sm sm:text-base font-semibold text-foreground",
  sectionDesc: "text-[10px] sm:text-xs text-muted",
  label: "landing-label",
  input: "landing-input",
  textarea: "landing-textarea",
  select: "landing-select",
  btnPrimary: "landing-btn-primary",
  btnSecondary: "landing-btn-secondary",
  btnGhost: "landing-btn-ghost",
  tabActive: "landing-tab-active",
  tabInactive: "landing-tab-inactive",
  chatBox: "landing-chat-box",
  chatList: "landing-chat-list",
  chatListHeader: "landing-chat-list-header",
  messageArea: "landing-message-area",
  ticketHeader: "landing-ticket-header",
  ticketCard: "landing-ticket-card",
  ticketCardSelected: "landing-ticket-card-selected",
  modal: "landing-modal",
  modalBackdrop: "landing-modal-backdrop",
  modalOverlay: "landing-modal-overlay",
  toast: "landing-toast",
  badge: "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold",
};

export function tabClass(active: boolean) {
  return active ? landing.tabActive : landing.tabInactive;
}

export function ticketCardClass(selected: boolean) {
  return `${landing.ticketCard}${selected ? ` ${landing.ticketCardSelected}` : ""}`;
}
