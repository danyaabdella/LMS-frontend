'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, ShoppingCart, Globe, Loader2, BarChart3, Upload, LogOut } from 'lucide-react'
import { analyticsApi, type AnalyticsData } from '@/lib/api'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'

import LineChart from '@/components/charts/LineChartWrapper'
import PieChart from '@/components/charts/PieChartWrapper'

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#6366f1']

type RegionStat = { name: string; value: number; percentage: number }
type EthiopianRegionStat = { region: string; value: number; percentage: number }

type DashboardData = AnalyticsData & {
  geographicalData?: RegionStat[]
  socialAnalytics?: {
    tiktok: { followers: number; engagement: number; reach: number }
    telegram: { subscribers: number; activeDaily: number; growth: string }
  }
  ethiopianRegionalData?: EthiopianRegionStat[]
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const analyticsData = await analyticsApi.getDashboard()
      setData(analyticsData)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Transform data for line chart
  const chartData = {
    labels: data?.dailyVisits.map(v =>
      new Date(v.date).toLocaleDateString('en-US', { weekday: 'short' })
    ) || [],
    datasets: [
      {
        label: 'Visits',
        data: data?.dailyVisits.map(v => v.totalVisits) || [],
        borderColor: '#3b82f6',
        tension: 0.3,
      },
      {
        label: 'Enrolled',
        data: data?.enrollments.map(e => e.count) || [],
        borderColor: '#06b6d4',
        tension: 0.3,
      },
      {
        label: 'Purchased',
        data: data?.purchases.map(p => p.count) || [],
        borderColor: '#8b5cf6',
        tension: 0.3,
      },
    ],
  }

  // Pie chart data - use real geographical data from API
  const geographicalData: RegionStat[] = data?.geographicalData ?? []
  const ethiopianRegionalData: EthiopianRegionStat[] = data?.ethiopianRegionalData ?? []
  const socialAnalytics = data?.socialAnalytics
  const pieData = {
    labels: geographicalData.map(r => r.name),
    datasets: [
      {
        data: geographicalData.map(r => r.value),
        backgroundColor: COLORS.slice(0, geographicalData.length),
      },
    ],
  }

  const totalStudents = data?.totalStudents || 0
  const enrolledThisWeek = data?.enrollments.reduce((s, e) => s + e.count, 0) || 0
  const participatedCompetitions = data?.competition.participants || 0
  const purchasedPackages = data?.purchases.reduce((s, p) => s + p.count, 0) || 0

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* SIDEBAR */}
      <div className="w-64 border-r border-slate-700 bg-slate-900/50 backdrop-blur-md flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-blue-400">Admin Panel</h2>
          {session && (
            <p className="text-sm text-slate-400 mt-1">{session.user.name}</p>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/analytics">
            <Button
              variant={pathname === '/admin/analytics' ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </Link>
          <Link href="/admin/upload">
            <Button
              variant={pathname === '/admin/upload' ? 'default' : 'ghost'}
              className="w-full justify-start"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-auto">
        {/* HEADER */}
        <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Analytics Dashboard</h1>
              <p className="text-slate-400">Platform insights and metrics</p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="max-w-7xl mx-auto px-4 py-8">
        {/* METRICS */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Card 1 */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Students</p>
                    <p className="text-3xl font-bold text-blue-400">{totalStudents}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400/50" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Enrolled This Week</p>
                  <p className="text-3xl font-bold text-cyan-400">{enrolledThisWeek}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-cyan-400/50" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Competition Participants</p>
                  <p className="text-3xl font-bold text-purple-400">{participatedCompetitions}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400/50" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Package Purchases</p>
                  <p className="text-3xl font-bold text-pink-400">{purchasedPackages}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-pink-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {socialAnalytics && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="border-slate-700 bg-linear-to-br from-[#2b1d4b] via-slate-900 to-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>TikTok Analytics</CardTitle>
                    <CardDescription>Community engagement</CardDescription>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300">TikTok</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Followers</span>
                  <span className="text-2xl font-bold">{socialAnalytics.tiktok.followers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Engagement</span>
                  <span className="text-xl text-purple-300">{socialAnalytics.tiktok.engagement.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Monthly Reach</span>
                  <span className="text-xl">{socialAnalytics.tiktok.reach.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-linear-to-br from-[#10344b] via-slate-900 to-slate-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Telegram Analytics</CardTitle>
                    <CardDescription>Community updates</CardDescription>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-300">Telegram</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Subscribers</span>
                  <span className="text-2xl font-bold">
                    {socialAnalytics.telegram.subscribers.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Active Daily</span>
                  <span className="text-xl">{socialAnalytics.telegram.activeDaily.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Growth</span>
                  <span className="text-xl text-cyan-300">{socialAnalytics.telegram.growth}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Daily visits, enrollments, purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart data={chartData} />
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>User Distribution by Region</CardTitle>
              <CardDescription>Geographical breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChart data={pieData} />
            </CardContent>
          </Card>
        </div>

        {/* REGIONAL TABLE */}
        <Card className="border-slate-700 bg-slate-800/50 mb-8">
          <CardHeader>
            <CardTitle>Regional Analytics</CardTitle>
            <CardDescription>Detailed region stats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-3 px-4 text-slate-400 text-left">Region</th>
                    <th className="py-3 px-4 text-slate-400 text-left">Users</th>
                    <th className="py-3 px-4 text-slate-400 text-left">Percentage</th>
                    <th className="py-3 px-4 text-slate-400 text-left">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {geographicalData.length > 0 ? (
                    geographicalData.map((region, idx) => (
                      <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/20">
                        <td className="py-3 px-4">{region.name}</td>
                        <td className="py-3 px-4 font-semibold">{region.value}</td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-blue-400 h-2 rounded-full"
                              style={{ width: `${region.percentage}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {region.percentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No geographical data available yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* GEOGRAPHICAL DISTRIBUTION SUMMARY */}
        {geographicalData.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Geographical Distribution Summary</CardTitle>
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {geographicalData.slice(0, 6).map((region, idx) => (
                  <div key={idx} className="p-4 border border-slate-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-blue-400">{region.name}</span>
                      <span className="text-sm text-slate-400">{region.percentage}%</span>
                    </div>
                    <div className="text-2xl font-bold">{region.value}</div>
                    <div className="text-xs text-slate-500 mt-1">users</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {ethiopianRegionalData.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50 mt-8">
            <CardHeader>
              <CardTitle>Ethiopian Regional Breakdown</CardTitle>
              <CardDescription>Users grouped by Ethiopian regions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="py-3 px-4 text-slate-400 text-left">Region</th>
                      <th className="py-3 px-4 text-slate-400 text-left">Users</th>
                      <th className="py-3 px-4 text-slate-400 text-left">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ethiopianRegionalData.map((region, idx) => (
                      <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/20">
                        <td className="py-3 px-4">{region.region}</td>
                        <td className="py-3 px-4 font-semibold">{region.value}</td>
                        <td className="py-3 px-4 text-slate-400">{region.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  )
}
