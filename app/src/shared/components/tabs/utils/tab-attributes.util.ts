/** A tab's own attributes: its id, role, state, and where its panel is (while chosen). */
export function tabAttributes(id: string, chosen: boolean, unavailable: boolean) {
  return {
    id,
    role: "tab",
    "aria-selected": chosen,
    "aria-controls": chosen ? `${id}-panel` : undefined,
    "aria-disabled": unavailable || undefined,
    tabIndex: chosen ? 0 : -1,
  };
}

/** A panel's own attributes: named by its tab, and out of sight and reach while it isn't chosen. */
export function panelAttributes(id: string, chosen: boolean) {
  return {
    id: `${id}-panel`,
    role: "tabpanel",
    "aria-labelledby": id,
    "data-off": !chosen || undefined,
    "aria-hidden": !chosen || undefined,
    inert: !chosen || undefined,
  };
}
