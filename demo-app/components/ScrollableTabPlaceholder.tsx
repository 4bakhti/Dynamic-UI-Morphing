import { BarChart3, FileText, Settings2, Users } from "lucide-react";

interface TabRecord {
  title: string;
  value: string;
  detail: string;
  progress: number;
}

interface TabData {
  description: string;
  metrics: Array<{ label: string; value: string }>;
  records: TabRecord[];
}

const TAB_DATA: Record<string, TabData> = {
  Analytics: {
    description: "A simple view of traffic, engagement, and conversion performance.",
    metrics: [
      { label: "Sessions", value: "84,291" },
      { label: "Conversion", value: "4.8%" },
      { label: "Avg. session", value: "6m 12s" },
      { label: "Bounce rate", value: "28.4%" },
    ],
    records: [
      { title: "Organic search", value: "31,842 visits", detail: "+12.4% from last month", progress: 82 },
      { title: "Direct traffic", value: "22,106 visits", detail: "+6.1% from last month", progress: 68 },
      { title: "Product engagement", value: "71% active", detail: "9,420 weekly users", progress: 71 },
      { title: "Checkout funnel", value: "4.8% converted", detail: "1,806 completed orders", progress: 48 },
      { title: "Mobile audience", value: "58% of traffic", detail: "Average load time: 1.4s", progress: 58 },
      { title: "Returning visitors", value: "42,390 users", detail: "+8.7% retention", progress: 76 },
    ],
  },
  Reports: {
    description: "Generated reports and their current delivery status.",
    metrics: [
      { label: "Published", value: "24" },
      { label: "Scheduled", value: "8" },
      { label: "Drafts", value: "5" },
      { label: "Recipients", value: "142" },
    ],
    records: [
      { title: "Q3 Executive Summary", value: "Published", detail: "Updated 2 hours ago", progress: 100 },
      { title: "Weekly Revenue Digest", value: "Scheduled", detail: "Next delivery: Monday 09:00", progress: 76 },
      { title: "Customer Health Review", value: "Draft", detail: "Last edited by Bakhtier", progress: 44 },
      { title: "Regional Sales Report", value: "Published", detail: "Sent to 38 recipients", progress: 100 },
      { title: "Product Adoption Brief", value: "Processing", detail: "Data refresh is 82% complete", progress: 82 },
      { title: "Annual Forecast", value: "Draft", detail: "12 sections remaining", progress: 36 },
    ],
  },
  Customers: {
    description: "A lightweight customer directory with account health data.",
    metrics: [
      { label: "Customers", value: "1,248" },
      { label: "New this month", value: "64" },
      { label: "Healthy", value: "91%" },
      { label: "At risk", value: "27" },
    ],
    records: [
      { title: "Northstar Labs", value: "$84,200 ARR", detail: "Healthy · 142 active seats", progress: 94 },
      { title: "Acme Industries", value: "$62,800 ARR", detail: "Healthy · Renewal in 82 days", progress: 88 },
      { title: "Vertex Systems", value: "$48,500 ARR", detail: "Needs attention · Usage down 9%", progress: 58 },
      { title: "Bluebird Retail", value: "$37,900 ARR", detail: "Healthy · 78 active seats", progress: 86 },
      { title: "Summit Logistics", value: "$29,400 ARR", detail: "Onboarding · 4 tasks remaining", progress: 64 },
      { title: "Cedar Finance", value: "$21,600 ARR", detail: "At risk · Renewal in 14 days", progress: 35 },
    ],
  },
  Settings: {
    description: "Current workspace preferences, integrations, and security controls.",
    metrics: [
      { label: "Integrations", value: "7 active" },
      { label: "Team members", value: "18" },
      { label: "Data retention", value: "90 days" },
      { label: "Security score", value: "96%" },
    ],
    records: [
      { title: "Behaviour telemetry", value: "Enabled", detail: "Numeric interaction signals only", progress: 100 },
      { title: "Daily data sync", value: "06:00 UTC", detail: "Last completed successfully", progress: 100 },
      { title: "Slack integration", value: "Connected", detail: "Posting to #analytics", progress: 100 },
      { title: "Report notifications", value: "Weekly", detail: "Email and in-app delivery", progress: 72 },
      { title: "Single sign-on", value: "Configured", detail: "18 of 18 members enrolled", progress: 100 },
      { title: "API usage limit", value: "68% used", detail: "Resets in 9 days", progress: 68 },
    ],
  },
};

const TAB_ICONS = {
  Analytics: BarChart3,
  Reports: FileText,
  Customers: Users,
  Settings: Settings2,
};

export function ScrollableTabPlaceholder({ tab }: { tab: string }) {
  const data = TAB_DATA[tab] ?? TAB_DATA.Analytics;
  const Icon = TAB_ICONS[tab as keyof typeof TAB_ICONS] ?? BarChart3;

  return (
    <section className="flex min-h-[200vh] flex-col gap-8 p-8" aria-labelledby="tab-content-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Workspace</p>
        <h2 id="tab-content-title" className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-900">
          <Icon className="h-7 w-7 text-indigo-500" aria-hidden="true" />
          {tab}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{data.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {data.records.map((record) => (
          <article key={record.title} className="min-h-64 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800">{record.title}</h3>
                <p className="mt-2 text-2xl font-semibold text-indigo-600">{record.value}</p>
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                {record.progress}%
              </span>
            </div>
            <p className="mt-8 text-sm text-slate-500">{record.detail}</p>
            <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${record.progress}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
