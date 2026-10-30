// Props for a panel that belongs to <Tabs idPrefix=...> (components/ui/Tabs.jsx).
export function tabPanelProps(idPrefix, id) {
  return { role: 'tabpanel', id: `${idPrefix}-panel-${id}`, 'aria-labelledby': `${idPrefix}-tab-${id}`, tabIndex: 0 };
}
