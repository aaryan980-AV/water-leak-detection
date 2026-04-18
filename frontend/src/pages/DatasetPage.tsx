import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Search, Filter, Download as DownloadIcon, ArrowUpDown, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getDataset, apiBase } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

export default function DatasetPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('Pressure')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    getDataset().then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [])

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  ).sort((a, b) => {
    const valA = a[sortField]
    const valB = b[sortField]
    if (sortOrder === 'asc') return valA > valB ? 1 : -1
    return valA < valB ? 1 : -1
  })

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const leakCount = data.filter(d => Number(d.Leakage_Flag) === 1).length
  const noLeakCount = data.length - leakCount

  const chartData = [
    { name: 'Leaks', value: leakCount, color: '#ef4444' },
    { name: 'Normal', value: noLeakCount, color: '#22c55e' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-500" />
            Sensor Dataset
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Historical sensor readings and leak detection labels for ML training.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open(`${apiBase}/download-dataset`, '_blank')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition"
          >
            <DownloadIcon className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center text-left">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border-none text-sm focus:ring-2 focus:ring-cyan-500/50 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              Showing {filteredData.length} of {data.length} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                    {[
                      { key: 'Pressure', label: 'Pressure' },
                      { key: 'Flow_Rate', label: 'Flow Rate' },
                      { key: 'Temperature', label: 'Temp' },
                      { key: 'Vibration', label: 'Vibration' },
                      { key: 'RPM', label: 'RPM' },
                      { key: 'Operational_Hours', label: 'Hours' },
                      { key: 'Leakage_Flag', label: 'Status' }
                    ].map((col) => (
                      <th 
                        key={col.key}
                        className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-cyan-500 transition-colors"
                        onClick={() => toggleSort(col.key)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredData.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {parseFloat(String(item.Pressure)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {parseFloat(String(item.Flow_Rate)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {parseFloat(String(item.Temperature)).toFixed(1)}°C
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {parseFloat(String(item.Vibration)).toFixed(3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {Math.round(item.RPM)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-mono">
                      {item.Operational_Hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        Number(item.Leakage_Flag) === 1
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      }`}>
                        {Number(item.Leakage_Flag) === 1 ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Leak Detected
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Nominal
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-3xl border border-slate-200 dark:border-white/10 p-6"
          >
            <h3 className="text-lg font-bold mb-4">Class Distribution</h3>
            <div className="h-48 w-full text-left">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-around text-center">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Leaks</p>
                <p className="text-xl font-bold text-red-500">{leakCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest">Normal</p>
                <p className="text-xl font-bold text-green-500">{noLeakCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl border border-slate-200 dark:border-white/10 p-6 bg-gradient-to-br from-cyan-500/5 to-transparent"
          >
            <h3 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-4">Dataset Info</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-left">
                <span className="text-slate-500">Model Version</span>
                <span className="font-mono bg-white/10 px-2 py-0.5 rounded">cnn-v3.2</span>
              </div>
              <div className="flex justify-between items-center text-sm text-left">
                <span className="text-slate-500">Last Augmented</span>
                <span className="font-medium">2 hours ago</span>
              </div>
              <div className="flex justify-between items-center text-sm text-left">
                <span className="text-slate-500">Total Samples</span>
                <span className="font-bold">{data.length}</span>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-xs text-cyan-800 dark:text-cyan-200 leading-relaxed text-left">
                This dataset is synchronized with all IoT acoustic nodes. Leak labels are validated by field team feedback.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
