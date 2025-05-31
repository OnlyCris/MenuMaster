import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Eye, Users, BarChart3, Globe, TrendingUp, Calendar } from "lucide-react";

interface AnalyticsData {
  basicStats: Array<{
    date: string;
    visits: number;
    qrScans: number;
  }>;
  mostViewedItems: Array<{
    menuItemId: number;
    name: string;
    description: string;
    price: number;
    viewCount: number;
    categoryName: string;
  }>;
  languageStats: Array<{
    language: string;
    viewCount: number;
    lastUsed: string;
  }>;
  totalViews: number;
  totalQrScans: number;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'it': 'Italiano',
  'en': 'English',
  'fr': 'Français',
  'es': 'Español',
  'de': 'Deutsch',
  'pt': 'Português',
  'ru': 'Русский',
  'zh': '中文',
  'ja': '日本語',
  'ar': 'العربية'
};

export default function Analytics() {
  const { id } = useParams();
  const [timeRange, setTimeRange] = useState(30);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: [`/api/restaurants/${id}/analytics`, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${id}/analytics?days=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time data
  });

  const { data: restaurant } = useQuery({
    queryKey: [`/api/restaurants/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/restaurants/${id}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/restaurants">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna ai Ristoranti
              </Link>
            </Button>
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Analitiche - Caricamento...
            </h1>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Header with back navigation */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/restaurants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai Ristoranti
            </Link>
          </Button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Analitiche - {restaurant?.name || 'Caricamento...'}
          </h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={timeRange === days ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(days)}
            >
              {days} giorni
            </Button>
          ))}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizzazioni Totali</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ultimi {timeRange} giorni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scansioni QR</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalQrScans || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ultimi {timeRange} giorni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Piatti Popolari</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.mostViewedItems?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Piatti con visualizzazioni
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lingue Utilizzate</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.languageStats?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Lingue diverse
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="dishes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dishes">Piatti Più Visti</TabsTrigger>
            <TabsTrigger value="languages">Statistiche Lingue</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="dishes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Classifica Piatti Più Osservati</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.mostViewedItems?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Posizione</TableHead>
                        <TableHead>Piatto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Prezzo</TableHead>
                        <TableHead>Visualizzazioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.mostViewedItems.map((item, index) => (
                        <TableRow key={item.menuItemId}>
                          <TableCell>
                            <Badge variant={index < 3 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.categoryName}</TableCell>
                          <TableCell>€{item.price?.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              {item.viewCount}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nessun dato disponibile per il periodo selezionato
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilizzo delle Lingue</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.languageStats?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lingua</TableHead>
                        <TableHead>Visualizzazioni</TableHead>
                        <TableHead>Ultimo Utilizzo</TableHead>
                        <TableHead>Percentuale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.languageStats.map((lang) => {
                        const percentage = analytics.totalViews > 0 
                          ? ((lang.viewCount / analytics.totalViews) * 100).toFixed(1)
                          : '0';
                        
                        return (
                          <TableRow key={lang.language}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                {LANGUAGE_NAMES[lang.language] || lang.language.toUpperCase()}
                              </div>
                            </TableCell>
                            <TableCell>{lang.viewCount}</TableCell>
                            <TableCell>
                              {new Date(lang.lastUsed).toLocaleDateString('it-IT')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{percentage}%</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nessun dato linguistico disponibile
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Andamento Temporale</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.basicStats?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Visualizzazioni</TableHead>
                        <TableHead>Scansioni QR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.basicStats
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((stat) => (
                          <TableRow key={stat.date}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(stat.date).toLocaleDateString('it-IT')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                {stat.visits || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                {stat.qrScans || 0}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nessun dato temporale disponibile
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}