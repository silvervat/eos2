'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

// Mock data for charts
const revenueData = [
  { month: 'Jan', tulud: 45000, kulud: 32000 },
  { month: 'Feb', tulud: 52000, kulud: 38000 },
  { month: 'Mar', tulud: 48000, kulud: 35000 },
  { month: 'Apr', tulud: 61000, kulud: 42000 },
  { month: 'Mai', tulud: 55000, kulud: 39000 },
  { month: 'Jun', tulud: 67000, kulud: 45000 },
  { month: 'Jul', tulud: 72000, kulud: 48000 },
  { month: 'Aug', tulud: 69000, kulud: 46000 },
  { month: 'Sep', tulud: 78000, kulud: 52000 },
  { month: 'Okt', tulud: 82000, kulud: 55000 },
  { month: 'Nov', tulud: 75000, kulud: 50000 },
  { month: 'Dets', tulud: 88000, kulud: 58000 },
]

const projectStatusData = [
  { name: 'Aktiivne', value: 12, color: '#279989' },
  { name: 'Ootel', value: 5, color: '#eab308' },
  { name: 'Lõpetatud', value: 8, color: '#22c55e' },
  { name: 'Mustand', value: 3, color: '#94a3b8' },
]

const monthlyProjectsData = [
  { month: 'Jan', alustatud: 3, lõpetatud: 2 },
  { month: 'Feb', alustatud: 4, lõpetatud: 3 },
  { month: 'Mar', alustatud: 2, lõpetatud: 4 },
  { month: 'Apr', alustatud: 5, lõpetatud: 3 },
  { month: 'Mai', alustatud: 3, lõpetatud: 2 },
  { month: 'Jun', alustatud: 4, lõpetatud: 5 },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Töölaud</h1>
        <p className="text-sm text-slate-500">Viimati uuendatud: täna, 14:30</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktiivsed projektid"
          value="12"
          change="+2"
          changeLabel="sel kuul"
          trend="up"
        />
        <StatCard
          title="Maksmata arved"
          value="23 450 €"
          change="3"
          changeLabel="arvet ootab"
          trend="neutral"
        />
        <StatCard
          title="Töötajaid"
          value="45"
          change="+3"
          changeLabel="sel kuul"
          trend="up"
        />
        <StatCard
          title="Kuu käive"
          value="88 000 €"
          change="+12%"
          changeLabel="vs eelmine kuu"
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart - 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Tulud vs Kulud</h2>
              <p className="text-sm text-slate-500">Viimased 12 kuud</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#279989' }} />
                <span className="text-slate-600">Tulud</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-slate-600">Kulud</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorTulud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#279989" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#279989" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('et-EE')} €`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="tulud"
                  stroke="#279989"
                  strokeWidth={2}
                  fill="url(#colorTulud)"
                  name="Tulud"
                />
                <Area
                  type="monotone"
                  dataKey="kulud"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="#f1f5f9"
                  name="Kulud"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Status Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Projektide staatus</h2>
          <p className="text-sm text-slate-500 mb-4">Kokku 28 projekti</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [`${value} projekti`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {projectStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Projects Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Projektide ülevaade</h2>
              <p className="text-sm text-slate-500">Alustatud vs lõpetatud</p>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyProjectsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="alustatud" fill="#279989" name="Alustatud" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lõpetatud" fill="#22c55e" name="Lõpetatud" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Viimased tegevused</h2>
            <button className="text-sm font-medium flex items-center gap-1 hover:underline" style={{ color: '#279989' }}>
              Vaata kõiki
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <ActivityItem
              title="Uus projekt loodud"
              description="Tallinna objekt - Ehitusprojekt"
              time="2 tundi tagasi"
              type="project"
            />
            <ActivityItem
              title="Arve kinnitatud"
              description="Arve #1234 - 5 600 EUR"
              time="4 tundi tagasi"
              type="invoice"
            />
            <ActivityItem
              title="Dokument üles laetud"
              description="Leping - Alltöö OÜ"
              time="1 päev tagasi"
              type="document"
            />
            <ActivityItem
              title="Töötaja lisatud"
              description="Mari Mets - Projektijuht"
              time="2 päeva tagasi"
              type="employee"
            />
            <ActivityItem
              title="Projekti staatus muudetud"
              description="Pärnu objekt → Lõpetatud"
              time="3 päeva tagasi"
              type="status"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  trend,
}: {
  title: string
  value: string
  change: string
  changeLabel: string
  trend: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <p className="text-sm text-slate-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <div className="flex items-center gap-1 mt-2">
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        <span
          className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
          }`}
        >
          {change}
        </span>
        <span className="text-sm text-slate-500">{changeLabel}</span>
      </div>
    </div>
  )
}

function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string
  description: string
  time: string
  type: 'project' | 'invoice' | 'document' | 'employee' | 'status'
}) {
  const colors = {
    project: '#279989',
    invoice: '#eab308',
    document: '#3b82f6',
    employee: '#8b5cf6',
    status: '#22c55e',
  }

  return (
    <div className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
      <div className="w-2 h-2 mt-2 rounded-full" style={{ backgroundColor: colors[type] }} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{title}</p>
        <p className="text-sm text-slate-600 truncate">{description}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
    </div>
  )
}
