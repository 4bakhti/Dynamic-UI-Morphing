export interface NavItem {
  label: string;
  icon: "home" | "chart" | "report" | "users" | "settings";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", icon: "home" },
  { label: "Analytics", icon: "chart" },
  { label: "Reports", icon: "report" },
  { label: "Customers", icon: "users" },
  { label: "Settings", icon: "settings" },
];

export interface MetricCard {
  label: string;
  value: string;
  delta: number;
}

export const METRICS: MetricCard[] = [
  { label: "Revenue", value: "$482,300", delta: 4.8 },
  { label: "Active Users", value: "12,940", delta: 2.1 },
  { label: "Conversion Rate", value: "3.42%", delta: -0.6 },
  { label: "Churn", value: "1.08%", delta: -0.3 },
];

export interface ChartSeries {
  name: string;
  color: string;
  points: number[];
}

export const CHART_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const CHART_SERIES: ChartSeries[] = [
  { name: "Revenue", color: "#4f46e5", points: [32, 41, 38, 52, 49, 62, 58, 70] },
  { name: "Target", color: "#94a3b8", points: [35, 38, 42, 46, 50, 54, 58, 62] },
];

export interface Notification {
  id: string;
  title: string;
  time: string;
  tone: "info" | "warning" | "success";
}

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "Weekly report generated", time: "2m ago", tone: "success" },
  { id: "n2", title: "API latency above threshold", time: "14m ago", tone: "warning" },
  { id: "n3", title: "3 new customers onboarded", time: "1h ago", tone: "info" },
  { id: "n4", title: "Export to CSV completed", time: "3h ago", tone: "success" },
];
