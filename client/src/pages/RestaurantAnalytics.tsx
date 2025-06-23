import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Restaurant, Analytics } from "@shared/schema";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Users, QrCode, Eye, TrendingUp, Globe } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";

const RestaurantAnalytics = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30");
  
  // Fetch restaurant data
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${id}`],
    enabled: !!id,
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery<{
    totalVisits: number;
    totalScans: number;
    chartData: Array<{
      date: string;
      visits: number;
      scans: number;
    }>;
    mostViewedItems: Array<{
      name: string;
      views: number;
      category: string;
    }>;
    languageStats: Array<{
      language: string;
      count: number;
      percentage: number;
    }>;
  }>({
    queryKey: [`/api/analytics/restaurant/${id}`, { days: dateRange }],
    enabled: !!id,
  });

  if (isRestaurantLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar title="Analitiche Ristorante" />
          <div className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar title="Ristorante non trovato" />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ristorante non trovato</h2>
              <Button onClick={() => setLocation("/dashboard")}>
                Torna alla Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar title={`Analitiche - ${restaurant.name}`} showNewButton={false} />
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Analitiche - {restaurant.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitora le performance del tuo ristorante
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                    <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                    <SelectItem value="90">Ultimi 90 giorni</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setLocation("/")} variant="outline">
                  Torna alla Dashboard
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visite Totali</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData?.totalVisits || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    negli ultimi {dateRange} giorni
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scansioni QR</CardTitle>
                  <QrCode className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData?.totalScans || 0}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    codici QR scansionati
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasso Conversione</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData?.totalVisits && analyticsData?.totalScans 
                      ? Math.round((analyticsData.totalScans / analyticsData.totalVisits) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    da QR a visita
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lingue Attive</CardTitle>
                  <Globe className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData?.languageStats?.length || 1}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    traduzioni utilizzate
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Visits Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Andamento Visite</CardTitle>
                  <CardDescription>
                    Visite e scansioni QR negli ultimi {dateRange} giorni
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isAnalyticsLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData?.chartData || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy')}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="visits" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6' }}
                            name="Visite"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="scans" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981' }}
                            name="Scansioni QR"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Language Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Utilizzo Lingue</CardTitle>
                  <CardDescription>
                    Distribuzione delle lingue utilizzate dai clienti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isAnalyticsLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : analyticsData?.languageStats?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.languageStats}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ language, percentage }) => `${language}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.languageStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        Nessun dato disponibile
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Most Viewed Items */}
            <Card>
              <CardHeader>
                <CardTitle>Piatti Più Visualizzati</CardTitle>
                <CardDescription>
                  I menu item che attirano più attenzione dai clienti
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAnalyticsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : analyticsData?.mostViewedItems?.length ? (
                  <div className="space-y-4">
                    {analyticsData.mostViewedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-900 dark:text-white">{item.views}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun dato sui piatti visualizzati</p>
                    <p className="text-sm">I dati appariranno quando i clienti inizieranno a visualizzare il menu</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantAnalytics;