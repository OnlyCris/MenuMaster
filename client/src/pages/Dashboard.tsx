import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Restaurant, Analytics } from "@shared/schema";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import StatCards from "@/components/dashboard/StatCards";
import RestaurantList from "@/components/dashboard/RestaurantList";
import TemplateGallery from "@/components/templates/TemplateGallery";
import MenuPreview from "@/components/menu/MenuPreview";
import RestaurantForm from "@/components/restaurants/RestaurantForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Fetch restaurants
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    enabled: isAuthenticated,
  });

  // Analytics data - for simplicity, using stats for all restaurants
  const [visitsToday, setVisitsToday] = useState(0);
  const [scansToday, setScansToday] = useState(0);
  
  // Simulate fetching analytics data
  useEffect(() => {
    if (restaurants.length > 0) {
      // Randomize for demo purposes - in real app, fetch from API
      setVisitsToday(Math.floor(Math.random() * 500) + 100);
      setScansToday(Math.floor(Math.random() * 200) + 50);
    }
  }, [restaurants]);

  // Handle restaurant edit/create
  const handleEditRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsAddingRestaurant(true);
  };

  // Handle restaurant QR generation
  const handleGenerateQR = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsQRModalOpen(true);
  };

  // Handle template preview/select
  const handlePreviewTemplate = () => {
    setIsPreviewModalOpen(true);
  };

  const [, setLocation] = useLocation();
  
  // If not authenticated and not loading, redirect to login
  if (!isAuthLoading && !isAuthenticated) {
    setLocation("/api/login");
    return null;
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      
      <div className="flex-1 pl-64 overflow-y-auto">
        <Topbar 
          title="Dashboard" 
          onNewRestaurantClick={() => {
            setSelectedRestaurant(null);
            setIsAddingRestaurant(true);
          }}
        />
        
        <div className="p-6">
          {/* Stats */}
          <StatCards 
            restaurantsCount={restaurants.length} 
            visitsToday={visitsToday}
            scansToday={scansToday}
          />
          
          {/* Restaurants List */}
          <RestaurantList 
            onEdit={handleEditRestaurant}
            onGenerateQR={handleGenerateQR}
          />
          
          {/* Templates Gallery */}
          <TemplateGallery 
            onSelect={() => {}} // In a real app, this would set the template for a restaurant
            onPreview={handlePreviewTemplate}
            limit={3}
          />
          
          {/* Recent Activity Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="border-b border-neutral-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-poppins font-semibold text-primary dark:text-white">Attività Recente</h3>
              <p className="text-sm text-neutral-300 dark:text-gray-400 mt-1">Visite e scansioni negli ultimi 7 giorni</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Lun', visite: Math.floor(Math.random() * 100) + 50, scansioni: Math.floor(Math.random() * 50) + 20 },
                    { name: 'Mar', visite: Math.floor(Math.random() * 100) + 50, scansioni: Math.floor(Math.random() * 50) + 20 },
                    { name: 'Mer', visite: Math.floor(Math.random() * 100) + 50, scansioni: Math.floor(Math.random() * 50) + 20 },
                    { name: 'Gio', visite: Math.floor(Math.random() * 100) + 50, scansioni: Math.floor(Math.random() * 50) + 20 },
                    { name: 'Ven', visite: Math.floor(Math.random() * 100) + 50, scansioni: Math.floor(Math.random() * 50) + 20 },
                    { name: 'Sab', visite: Math.floor(Math.random() * 100) + 50, scansioni: Math.floor(Math.random() * 50) + 20 },
                    { name: 'Dom', visite: Math.floor(Math.random() * 100) + 50, scansioni: Math.floor(Math.random() * 50) + 20 },
                  ]}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visite" name="Visite" fill="#2C3E50" />
                  <Bar dataKey="scansioni" name="Scansioni QR" fill="#F39C12" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      {/* Restaurant Form Modal */}
      <Dialog open={isAddingRestaurant} onOpenChange={setIsAddingRestaurant}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRestaurant ? "Modifica Ristorante" : "Aggiungi Ristorante"}
            </DialogTitle>
            <DialogDescription>
              {selectedRestaurant 
                ? "Modifica i dettagli del ristorante" 
                : "Compila il form per creare un nuovo ristorante"}
            </DialogDescription>
          </DialogHeader>
          
          <RestaurantForm 
            restaurant={selectedRestaurant || undefined}
            onComplete={() => setIsAddingRestaurant(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Codice QR del Menu</DialogTitle>
            <DialogDescription>
              Codice QR per {selectedRestaurant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {selectedRestaurant && (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${selectedRestaurant.subdomain}.menumaster.com`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="mt-4 text-sm text-center text-muted-foreground">
                  Questo codice QR reindirizza a<br />
                  <span className="font-medium text-primary">
                    https://{selectedRestaurant.subdomain}.menumaster.com
                  </span>
                </p>
                <div className="mt-4 flex space-x-2">
                  <Button>Scarica PNG</Button>
                  <Button variant="outline">Scarica PDF</Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Template Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Anteprima Template</DialogTitle>
            <DialogDescription>
              Ecco come apparirà il template sul dispositivo dei clienti
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            {/* This would be a component that shows the template preview */}
            <div className="border rounded-lg p-4 w-full max-w-md">
              <div className="bg-primary text-white p-4 text-center rounded-t-lg">
                <h3 className="font-bold text-xl">Nome Ristorante</h3>
                <p className="text-sm">Cucina italiana tradizionale</p>
              </div>
              <div className="flex overflow-x-auto whitespace-nowrap p-2 border-b">
                <Button variant="default" size="sm" className="mr-2">Antipasti</Button>
                <Button variant="ghost" size="sm" className="mr-2">Primi</Button>
                <Button variant="ghost" size="sm" className="mr-2">Secondi</Button>
                <Button variant="ghost" size="sm">Dessert</Button>
              </div>
              
              <div className="p-4 space-y-4">
                <h4 className="font-bold">Antipasti</h4>
                
                <div className="flex border-b pb-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4">
                    <div className="flex justify-between">
                      <h5 className="font-bold">Nome Piatto</h5>
                      <span className="font-bold text-accent">€12.00</span>
                    </div>
                    <p className="text-sm text-neutral-300 my-1">Descrizione del piatto</p>
                    <div className="flex gap-1">
                      <span className="bg-neutral-100 text-xs px-2 py-1 rounded-full text-neutral-300">
                        Allergene 1
                      </span>
                      <span className="bg-neutral-100 text-xs px-2 py-1 rounded-full text-neutral-300">
                        Allergene 2
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4">
                    <div className="flex justify-between">
                      <h5 className="font-bold">Nome Piatto</h5>
                      <span className="font-bold text-accent">€9.50</span>
                    </div>
                    <p className="text-sm text-neutral-300 my-1">Descrizione del piatto</p>
                    <div className="flex gap-1">
                      <span className="bg-neutral-100 text-xs px-2 py-1 rounded-full text-neutral-300">
                        Allergene 1
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-100 p-3 text-center rounded-b-lg">
                <p className="text-xs text-neutral-300">Menu aggiornato il 01/07/2023</p>
                <p className="text-xs text-accent mt-1">Powered by MenuMaster</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setIsPreviewModalOpen(false)}>Chiudi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
