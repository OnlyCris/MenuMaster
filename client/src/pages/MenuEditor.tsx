import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { default as MenuEditorComponent } from "@/components/menu/MenuEditor";
import MenuPreview from "@/components/menu/MenuPreview";
import { Restaurant } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MenuEditor = () => {
  const { id } = useParams();
  const restaurantId = parseInt(id);

  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("editor");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  // Fetch restaurant details
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${restaurantId}`],
    enabled: !!restaurantId && isAuthenticated,
  });

  const [, setLocation] = useLocation();
  
  // If not authenticated and not loading, redirect to login
  if (!isAuthLoading && !isAuthenticated) {
    setLocation("/api/login");
    return null;
  }

  if (isAuthLoading || isRestaurantLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }
  
  if (!restaurant && !isRestaurantLoading) {
    setLocation("/restaurants");
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      
      <div className="flex-1 pl-64 overflow-y-auto">
        <Topbar 
          title={`Menu di ${restaurant?.name || 'Ristorante'}`}
          showNewButton={false}
        />
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="editor">Editor Menu</TabsTrigger>
              <TabsTrigger value="preview">Anteprima</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="mt-6">
              <MenuEditorComponent 
                restaurantId={restaurantId}
                onRefresh={() => {}}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="mt-6">
              <MenuPreview 
                restaurantId={restaurantId}
                onGenerateQR={() => setIsQRModalOpen(true)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Codice QR del Menu</DialogTitle>
            <DialogDescription>
              Codice QR per {restaurant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-4">
            {restaurant && (
              <>
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://${restaurant.subdomain}.menumaster.com`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="mt-4 text-sm text-center text-muted-foreground">
                  Questo codice QR reindirizza a<br />
                  <span className="font-medium text-primary">
                    https://{restaurant.subdomain}.menumaster.com
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

export default MenuEditor;
