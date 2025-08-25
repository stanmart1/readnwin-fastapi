interface TabDefinition {
  id: string;
  label: string;
  icon: string;
  description: string;
  permissions: string[];
}

const ADMIN_TABS: TabDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "ri-dashboard-line",
    description: "Dashboard overview with key metrics",
    permissions: ["view_dashboard"],
  },
  {
    id: "users",
    label: "Users",
    icon: "ri-user-line",
    description: "Manage user accounts and profiles",
    permissions: ["manage_users"],
  },
  {
    id: "roles",
    label: "Roles",
    icon: "ri-shield-user-line",
    description: "Manage user roles and permissions",
    permissions: ["manage_roles"],
  },
  {
    id: "audit",
    label: "Audit Logs",
    icon: "ri-file-list-line",
    description: "View system audit logs and activities",
    permissions: ["view_audit_logs"],
  },
  {
    id: "books",
    label: "Books",
    icon: "ri-book-line",
    description: "Manage book catalog and inventory",
    permissions: ["manage_books"],
  },

  {
    id: "reviews",
    label: "Reviews",
    icon: "ri-star-line",
    description: "Manage book reviews and ratings",
    permissions: ["manage_reviews"],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "ri-notification-line",
    description: "Manage system notifications",
    permissions: ["manage_notifications"],
  },
  {
    id: "orders",
    label: "Orders",
    icon: "ri-shopping-cart-line",
    description: "Manage customer orders and transactions",
    permissions: ["manage_orders"],
  },
  {
    id: "shipping",
    label: "Shipping",
    icon: "ri-truck-line",
    description: "Manage shipping and delivery",
    permissions: ["manage_shipping"],
  },
  {
    id: "reading",
    label: "Reading Analytics",
    icon: "ri-bar-chart-line",
    description: "View reading analytics and insights",
    permissions: ["view_analytics"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "ri-file-chart-line",
    description: "Generate and view system reports",
    permissions: ["view_reports"],
  },
  {
    id: "email-templates",
    label: "Email Templates",
    icon: "ri-mail-line",
    description: "Manage email templates and notifications",
    permissions: ["manage_email_templates"],
  },
  {
    id: "blog",
    label: "Blog",
    icon: "ri-article-line",
    description: "Manage blog posts and content",
    permissions: ["manage_blog"],
  },
  {
    id: "works",
    label: "Works",
    icon: "ri-briefcase-line",
    description: "Manage portfolio works and projects",
    permissions: ["manage_works"],
  },
  {
    id: "about",
    label: "About",
    icon: "ri-information-line",
    description: "Manage about page content",
    permissions: ["manage_about"],
  },
  {
    id: "contact",
    label: "Contact",
    icon: "ri-phone-line",
    description: "Manage contact information and messages",
    permissions: ["manage_contact"],
  },
  {
    id: "faq",
    label: "FAQ",
    icon: "ri-question-line",
    description: "Manage frequently asked questions",
    permissions: ["manage_faq"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "ri-settings-line",
    description: "Manage system settings and configuration",
    permissions: ["manage_settings"],
  },
];

export function getVisibleTabs(permissions: string[]): TabDefinition[] {
  return ADMIN_TABS.filter((tab) =>
    tab.permissions.some((perm) => permissions.includes(perm)),
  );
}

export function canAccessTab(tabId: string, permissions: string[], userRole?: string): boolean {
  // Allow admin and super_admin roles to access all tabs
  if (userRole === 'admin' || userRole === 'super_admin') {
    return true;
  }
  
  const tab = ADMIN_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  return tab.permissions.some((perm) => permissions.includes(perm));
}
