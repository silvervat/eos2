'use client'

import { useState } from 'react'
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
  LineChart,
  Line,
  ComposedChart,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  ChevronDown,
  FileText,
  Users,
  Euro,
  FolderKanban,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'

// Mock data
const revenueData = [
  { month: 'Jan', tulud: 45000, kulud: 32000, kasum: 13000 },
  { month: 'Feb', tulud: 52000, kulud: 38000, kasum: 14000 },
  { month: 'Mar', tulud: 48000, kulud: 35000, kasum: 13000 },
  { month: 'Apr', tulud: 61000, kulud: 42000, kasum: 19000 },
  { month: 'Mai', tulud: 55000, kulud: 39000, kasum: 16000 },
  { month: 'Jun', tulud: 67000, kulud: 45000, kasum: 22000 },
  { month: 'Jul', tulud: 72000, kulud: 48000, kasum: 24000 },
  { month: 'Aug', tulud: 69000, kulud: 46000, kasum: 23000 },
  { month: 'Sep', tulud: 78000, kulud: 52000, kasum: 26000 },
  { month: 'Okt', tulud: 82000, kulud: 55000, kasum: 27000 },
  { month: 'Nov', tulud: 75000, kulud: 50000, kasum: 25000 },
  { month: 'Dets', tulud: 88000, kulud: 58000, kasum: 30000 },
]

const projectsByType = [
  { name: 'Uusehitus', value: 8, color: '#279989' },
  { name: 'Renoveerimine', value: 12, color: '#3b82f6' },
  { name: 'Remont', value: 5, color: '#eab308' },
  { name: 'Konsultatsioon', value: 3, color: '#8b5cf6' },
]

const projectsByStatus = [
  { name: 'Aktiivne', value: 12, color: '#279989' },
  { name: 'Ootel', value: 5, color: '#eab308' },
  { name: 'Lõpetatud', value: 8, color: '#22c55e' },
  { name: 'Mustand', value: 3, color: '#94a3b8' },
]

const employeePerformance = [
  { name: 'Mari Mets', projektid: 8, tõhusus: 95, tunde: 168 },
  { name: 'Jaan Tamm', projektid: 6, tõhusus: 88, tunde: 160 },
  { name: 'Liis Kask', projektid: 7, tõhusus: 92, tunde: 172 },
  { name: 'Peeter Sepp', projektid: 5, tõhusus: 85, tunde: 156 },
  { name: 'Anne Rebane', projektid: 9, tõhusus: 97, tunde: 176 },
]

const invoiceStatus = [
  { name: 'Tasutud', value: 45, color: '#22c55e' },
  { name: 'Ootel', value: 12, color: '#eab308' },
  { name: 'Üle tähtaja', value: 3, color: '#ef4444' },
]

const monthlyComparison = [
  { month: 'Jan', '2023': 38000, '2024': 45000 },
  { month: 'Feb', '2023': 42000, '2024': 52000 },
  { month: 'Mar', '2023': 45000, '2024': 48000 },
  { month: 'Apr', '2023': 48000, '2024': 61000 },
  { month: 'Mai', '2023': 50000, '2024': 55000 },
  { month: 'Jun', '2023': 55000, '2024': 67000 },
  { month: 'Jul', '2023': 58000, '2024': 72000 },
  { month: 'Aug', '2023': 54000, '2024': 69000 },
  { month: 'Sep', '2023': 62000, '2024': 78000 },
  { month: 'Okt', '2023': 65000, '2024': 82000 },
  { month: 'Nov', '2023': 60000, '2024': 75000 },
  { month: 'Dets', '2023': 70000, '2024': 88000 },
]

const weeklyActivity = [
  { day: 'E', tunnid: 45, projektid: 5 },
  { day: 'T', tunnid: 52, projektid: 7 },
  { day: 'K', tunnid: 48, projektid: 6 },
  { day: 'N', tunnid: 55, projektid: 8 },
  { day: 'R', tunnid: 40, projektid: 4 },
]

type Period = 'week' | 'month' | 'quarter' | 'year'

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('year')
  const [showPeriodMenu, setShowPeriodMenu] = useState(false)

  const periodLabels: Record<Period, string> = {
    week: 'Nädal',
    month: 'Kuu',
    quarter: 'Kvartal',
    year: 'Aasta',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aruanded</h1>
          <p className="text-sm text-slate-500 mt-1">Ülevaade äri tulemustest</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="relative">
            <button
              onClick={() => setShowPeriodMenu(!showPeriodMenu)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {periodLabels[period]}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showPeriodMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                {(Object.keys(periodLabels) as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPeriod(p)
                      setShowPeriodMenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                      period === p ? 'text-primary font-medium' : 'text-slate-700'
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            style={{ backgroundColor: '#279989' }}
          >
            <Download className="w-4 h-4" />
            Ekspordi PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Aasta käive"
          value="792 000 €"
          change="+18%"
          trend="up"
          icon={Euro}
          color="#279989"
        />
        <KPICard
          title="Aktiivsed projektid"
          value="12"
          change="+3"
          trend="up"
          icon={FolderKanban}
          color="#3b82f6"
        />
        <KPICard
          title="Töötunde kokku"
          value="8 640"
          change="+12%"
          trend="up"
          icon={Clock}
          color="#8b5cf6"
        />
        <KPICard
          title="Lõpetatud projektid"
          value="28"
          change="+5"
          trend="up"
          icon={CheckCircle}
          color="#22c55e"
        />
      </div>

      {/* Revenue Chart - Full width */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Finantsülevaade</h2>
            <p className="text-sm text-slate-500">Tulud, kulud ja kasum</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#279989' }} />
              <span className="text-slate-600">Tulud</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-slate-600">Kulud</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-slate-600">Kasum</span>
            </div>
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueData}>
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
              <Line
                type="monotone"
                dataKey="kulud"
                stroke="#94a3b8"
                strokeWidth={2}
                dot={false}
                name="Kulud"
              />
              <Bar dataKey="kasum" fill="#22c55e" name="Kasum" radius={[4, 4, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Projects by Type */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Projektid tüübi järgi</h2>
          <p className="text-sm text-slate-500 mb-4">Kokku 28 projekti</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectsByType.map((entry, index) => (
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
            {projectsByType.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects by Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Projektide staatus</h2>
          <p className="text-sm text-slate-500 mb-4">Hetke seis</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {projectsByStatus.map((entry, index) => (
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
            {projectsByStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Arvete staatus</h2>
          <p className="text-sm text-slate-500 mb-4">Kokku 60 arvet</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={invoiceStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {invoiceStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [`${value} arvet`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {invoiceStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Year over Year Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Aastate võrdlus</h2>
              <p className="text-sm text-slate-500">2023 vs 2024</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <span className="text-slate-600">2023</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#279989' }} />
                <span className="text-slate-600">2024</span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyComparison}>
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
                <Line
                  type="monotone"
                  dataKey="2023"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="2023"
                />
                <Line
                  type="monotone"
                  dataKey="2024"
                  stroke="#279989"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="2024"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Nädala aktiivsus</h2>
              <p className="text-sm text-slate-500">Tunnid ja projektid päevade kaupa</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="tunnid" fill="#279989" name="Tunde" radius={[4, 4, 0, 0]} />
                <Bar dataKey="projektid" fill="#3b82f6" name="Projekte" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Töötajate tulemuslikkus</h2>
            <p className="text-sm text-slate-500">Top 5 töötajat sel kuul</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Nimi</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Projekte</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Tõhusus</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Tunde</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Progress</th>
              </tr>
            </thead>
            <tbody>
              {employeePerformance.map((employee, index) => (
                <tr key={employee.name} className="border-b border-slate-100 last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-900">{employee.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{employee.projektid}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-medium ${
                        employee.tõhusus >= 90
                          ? 'text-green-600'
                          : employee.tõhusus >= 80
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {employee.tõhusus}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{employee.tunde}h</td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${employee.tõhusus}%`,
                          backgroundColor: employee.tõhusus >= 90 ? '#22c55e' : employee.tõhusus >= 80 ? '#eab308' : '#ef4444',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
          <span
            className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
            }`}
          >
            {change}
          </span>
        </div>
      </div>
      <p className="text-sm text-slate-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
