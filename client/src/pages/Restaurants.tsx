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
      
      <div className="flex-1 md:pl-64 overflow-y-auto">
        <Topbar 
          title="I Miei Ristoranti" 
          showNewButton={true}
          onNewRestaurantClick={() => {
            setSelectedRestaurant(null);
            setIsAddingRestaurant(true);
          }}
        />
        
        <div className="p-3 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 md:h-12">
              <TabsTrigger value="lista" className="text-xs md:text-sm px-2 md:px-4">Lista Ristoranti</TabsTrigger>
              <TabsTrigger value="griglia" className="text-xs md:text-sm px-2 md:px-4">Vista Griglia</TabsTrigger>
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
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden p-3 md:p-6">
          <DialogHeader className="mb-2 md:mb-4">
            <DialogTitle className="text-sm md:text-lg">
              {selectedRestaurant ? "Modifica Ristorante" : "Aggiungi Ristorante"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
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
        <DialogContent className="w-[95vw] max-w-md p-4 md:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-sm md:text-lg">Codice QR del Menu</DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Codice QR per {selectedRestaurant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {selectedRestaurant && (
              <>
                <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${selectedRestaurant.subdomain}.menuisland.it`}
                    alt="QR Code"
                    className="w-36 h-36 md:w-48 md:h-48"
                  />
                </div>
                <p className="mt-3 md:mt-4 text-xs md:text-sm text-center text-muted-foreground px-2">
                  Questo codice QR reindirizza a<br />
                  <span className="font-medium text-primary break-all text-xs md:text-sm">
                    https://{selectedRestaurant.subdomain}.menuisland.it
                  </span>
                </p>
                <div className="mt-3 md:mt-4 flex flex-col sm:flex-row gap-2 w-full">
                  <Button className="text-sm flex-1">Scarica PNG</Button>
                  <Button variant="outline" className="text-sm flex-1">Scarica PDF</Button>
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
