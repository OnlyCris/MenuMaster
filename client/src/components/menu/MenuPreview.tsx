import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Restaurant, Category, MenuItem, Allergen } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type MenuPreviewProps = {
  restaurantId: number;
  onGenerateQR: () => void;
};

const MenuPreview = ({ restaurantId, onGenerateQR }: MenuPreviewProps) => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("");
  
  const { data: restaurant, isLoading: isLoadingRestaurant } = useQuery<Restaurant>({
    queryKey: [`/api/restaurants/${restaurantId}`],
  });
  
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
    enabled: !!restaurantId,
  });
  
  const { data: menuItems = {}, isLoading: isLoadingMenuItems } = useQuery<Record<number, MenuItem[]>>({
    queryKey: [`/api/restaurants/${restaurantId}/menu-items`],
    enabled: !!categories.length,
    queryFn: async () => {
      const result: Record<number, MenuItem[]> = {};
      
      for (const category of categories) {
        const response = await fetch(`/api/categories/${category.id}/menu-items`);
        if (response.ok) {
          result[category.id] = await response.json();
        }
      }
      
      return result;
    },
  });
  
  const { data: allergensMap = {}, isLoading: isLoadingAllergens } = useQuery<Record<number, Allergen[]>>({
    queryKey: [`/api/restaurants/${restaurantId}/allergens`],
    enabled: !!Object.values(menuItems).flat().length,
    queryFn: async () => {
      const result: Record<number, Allergen[]> = {};
      
      for (const items of Object.values(menuItems)) {
        for (const item of items) {
          const response = await fetch(`/api/menu-items/${item.id}/allergens`);
          if (response.ok) {
            result[item.id] = await response.json();
          }
        }
      }
      
      return result;
    },
  });
  
  // Set active category if not set
  if (categories.length > 0 && !activeCategory) {
    setActiveCategory(categories[0].id.toString());
  }
  
  const activeCategoryItems = activeCategory ? menuItems[parseInt(activeCategory)] || [] : [];
  
  const isLoading = isLoadingRestaurant || isLoadingCategories || isLoadingMenuItems || isLoadingAllergens;
  
  const handleGenerateQR = async () => {
    if (!restaurant) return;
    
    try {
      await apiRequest("POST", "/api/qr-codes", {
        restaurantId: restaurant.id,
        name: `QR per ${restaurant.name}`,
        qrData: `https://${restaurant.subdomain}.menuisland.it`,
      });
      
      toast({
        title: "QR Code generato",
        description: "Il codice QR è stato generato con successo. Lo troverai nella scheda dei QR codes",
        variant: "default",
      });
      
      onGenerateQR();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile generare il codice QR",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="shadow-sm overflow-hidden mb-8">
      <CardHeader className="border-b border-neutral-100 px-6 py-6">
        <CardTitle className="text-lg font-poppins font-semibold text-primary">
          Anteprima Menu
        </CardTitle>
        <CardDescription className="text-sm text-neutral-300 mt-1">
          Così apparirà il menu sui dispositivi dei tuoi clienti
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="flex justify-center">
          <div className="rounded-lg shadow-lg overflow-hidden border border-neutral-200" style={{ width: "375px" }}>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
                <div className="p-4 space-y-4">
                  <Skeleton className="h-6 w-1/3" />
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-20 w-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-primary text-white p-4 text-center">
                  <div className="font-lato font-bold text-xl">{restaurant?.name || "Ristorante"}</div>
                  <div className="font-lato text-sm mt-1">{restaurant?.category || "Menu digitale"}</div>
                </div>
                
                {/* Menu Navigation */}
                <div className="flex border-b border-neutral-100 overflow-x-auto whitespace-nowrap p-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`px-3 py-1 rounded-lg mr-2 font-lato text-sm ${
                        activeCategory === category.id.toString()
                          ? "bg-accent text-white"
                          : "hover:bg-neutral-100 text-neutral-300"
                      }`}
                      onClick={() => setActiveCategory(category.id.toString())}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                
                {/* Menu Section */}
                <div className="p-4">
                  <h4 className="font-lato font-bold text-primary">
                    {categories.find(c => c.id.toString() === activeCategory)?.name || "Menu"}
                  </h4>
                  
                  <div className="mt-4 space-y-4">
                    {activeCategoryItems.map((item) => (
                      <div key={item.id} className="flex border-b border-neutral-100 pb-4">
                        <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={item.imageUrl || "https://via.placeholder.com/150?text=Dish"} 
                            alt={item.name} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <h5 className="font-lato font-bold text-primary">{item.name}</h5>
                            <span className="font-lato font-bold text-accent">{item.price}</span>
                          </div>
                          <p className="text-sm text-neutral-300 mt-1 font-lato">
                            {item.description || "Descrizione del piatto"}
                          </p>
                          <div className="flex mt-2 flex-wrap gap-1">
                            {allergensMap[item.id]?.map((allergen) => (
                              <span 
                                key={allergen.id}
                                className="bg-neutral-100 text-xs px-2 py-1 rounded-full text-neutral-300"
                              >
                                <span dangerouslySetInnerHTML={{ __html: allergen.icon || "" }} className="mr-1" />
                                {allergen.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {activeCategoryItems.length === 0 && (
                      <div className="text-center py-8 text-neutral-300">
                        Nessun piatto in questa categoria
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-neutral-100 p-3 text-center">
                  <div className="text-xs text-neutral-300 font-lato">
                    Menu aggiornato il {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-xs text-accent font-lato mt-1">
                    Powered by MenuMaster
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Button 
            className="bg-primary text-white hover:bg-primary/90 transition"
            onClick={handleGenerateQR}
            disabled={isLoading}
          >
            <QrCode className="mr-2 h-4 w-4" /> Genera QR Code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuPreview;
