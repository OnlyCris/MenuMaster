import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Restaurant } from "@shared/schema";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import RestaurantList from "@/components/dashboard/RestaurantList";
import RestaurantForm from "@/components/restaurants/RestaurantForm";
import MenuPreview from "@/components/menu/MenuPreview";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

const Restaurants = () => {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [isAddingRestaurant, setIsAddingRestaurant] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [activeTab, setActiveTab] = useState("lista");

  // Fetch restaurants
  const { data: restaurants = [], isLoading: isRestaurantsLoading, refetch } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    enabled: isAuthenticated,
  });

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
          title="Gestione Ristoranti" 
          onNewRestaurantClick={() => {
            setSelectedRestaurant(null);
            setIsAddingRestaurant(true);
          }}
        />
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="lista">Lista Ristoranti</TabsTrigger>
              <TabsTrigger value="nuovo">Nuovo Ristorante</TabsTrigger>
              {selectedRestaurant && (
                <TabsTrigger value="anteprima">
                  Anteprima {selectedRestaurant.name}
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="lista" className="mt-6">
              <RestaurantList 
                onEdit={handleEditRestaurant}
                onGenerateQR={handleGenerateQR}
              />
            </TabsContent>
            
            <TabsContent value="nuovo" className="mt-6">
              <RestaurantForm 
                onComplete={() => {
                  refetch();
                  setActiveTab("lista");
                }}
              />
            </TabsContent>
            
            {selectedRestaurant && (
              <TabsContent value="anteprima" className="mt-6">
                <MenuPreview 
                  restaurantId={selectedRestaurant.id}
                  onGenerateQR={() => setIsQRModalOpen(true)}
                />
              </TabsContent>
            )}
          </Tabs>
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
            onComplete={() => {
              setIsAddingRestaurant(false);
              refetch();
            }}
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
    </div>
  );
};

export default Restaurants;
