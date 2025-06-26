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

  // Function to download QR code
  const downloadQR = async (subdomain: string, format: 'png' | 'pdf') => {
    try {
      const domain = window.location.hostname.includes('.') ? window.location.hostname.split('.').slice(-2).join('.') : 'menuisland.it';
      const qrUrl = `https://${subdomain}.${domain}`;
      
      if (format === 'png') {
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;
        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = `qr-${subdomain}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'pdf') {
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>QR Code - ${subdomain}</title>
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                  img { margin: 20px 0; }
                  h1 { color: #333; }
                  p { color: #666; margin: 10px 0; }
                </style>
              </head>
              <body>
                <h1>QR Code Menu</h1>
                <p>Ristorante: <strong>${subdomain}</strong></p>
                <img src="${qrImageUrl}" alt="QR Code" />
                <p>Scansiona per visualizzare il menu</p>
                <p><strong>${qrUrl}</strong></p>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Errore durante il download del QR:', error);
    }
  };

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
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${selectedRestaurant.subdomain}.${window.location.hostname.includes('.') ? window.location.hostname.split('.').slice(-2).join('.') : 'menuisland.it'}`}
                    alt="QR Code"
                    className="w-36 h-36 md:w-48 md:h-48"
                  />
                </div>
                <p className="mt-3 md:mt-4 text-xs md:text-sm text-center text-muted-foreground px-2">
                  Questo codice QR reindirizza a<br />
                  <span className="font-medium text-primary break-all text-xs md:text-sm">
                    https://{selectedRestaurant.subdomain}.{window.location.hostname.includes('.') ? window.location.hostname.split('.').slice(-2).join('.') : 'menuisland.it'}
                  </span>
                </p>
                <div className="mt-3 md:mt-4 flex flex-col sm:flex-row gap-2 w-full">
                  <Button 
                    className="text-sm flex-1"
                    onClick={() => downloadQR(selectedRestaurant.subdomain, 'png')}
                  >
                    Scarica PNG
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-sm flex-1"
                    onClick={() => downloadQR(selectedRestaurant.subdomain, 'pdf')}
                  >
                    Scarica PDF
                  </Button>
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
