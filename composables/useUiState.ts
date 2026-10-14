/** 全站 UI 状态（SSR 安全，无需引入 Pinia） */
export function useUiState() {
  const sidebarOpen = useState('ui:sidebar', () => false)
  const searchQuery = useState('ui:search', () => '')
  const mobileMenuOpen = useState('ui:mobileMenu', () => false)

  return {
    sidebarOpen,
    searchQuery,
    mobileMenuOpen,
    toggleSidebar: () => (sidebarOpen.value = !sidebarOpen.value),
    closeSidebar: () => (sidebarOpen.value = false),
    openSidebar: () => (sidebarOpen.value = true),
    toggleMobileMenu: () => (mobileMenuOpen.value = !mobileMenuOpen.value),
    closeMobileMenu: () => (mobileMenuOpen.value = false)
  }
}
