import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Restaurant, Category, MenuItem, Allergen, Template } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

type MenuData = {
  restaurant: Restaurant;
  template: Template;
  categories: (Category & { items: (MenuItem & { allergens: Allergen[] })[] })[];
};

const RestaurantView = () => {
  const { subdomain } = useParams();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  
  // Fetch menu data
  const { data, isLoading, error } = useQuery<MenuData>({
    queryKey: [`/api/view/${subdomain}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Track QR scan and language usage
  useEffect(() => {
    const trackScan = async () => {
      try {
        if (subdomain && data?.restaurant?.id) {
          await apiRequest("GET", `/api/scan/${subdomain}`);
          
          // Track language usage
          await apiRequest("POST", `/api/restaurants/${data.restaurant.id}/track-view`, {
            language: 'it', // Default language for public menu
            userAgent: navigator.userAgent
          });
        }
      } catch (error) {
        console.error("Failed to track QR scan:", error);
      }
    };
    
    if (subdomain && !isLoading && data) {
      trackScan();
    }
  }, [subdomain, isLoading, data]);

  // Track menu item views when user clicks on items
  const trackMenuItemView = async (menuItemId: number) => {
    try {
      if (data?.restaurant?.id) {
        await apiRequest("POST", `/api/restaurants/${data.restaurant.id}/track-view`, {
          menuItemId,
          language: 'it',
          userAgent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error("Failed to track menu item view:", error);
    }
  };
  
  // Set first category as active when data loads
  useEffect(() => {
    if (data?.categories?.length && activeCategory === null) {
      setActiveCategory(data.categories[0].id);
    }
  }, [data, activeCategory]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-16 w-full rounded-lg mb-4" />
          <Skeleton className="h-10 w-full rounded-lg mb-6" />
          
          <div className="flex overflow-x-auto space-x-2 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-lg flex-shrink-0" />
            ))}
          </div>
          
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-4/5 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Menu non trovato</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Non è stato possibile trovare il menu richiesto. Il sottodominio potrebbe non essere valido.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary text-white"
          >
            Riprova
          </Button>
        </div>
      </div>
    );
  }
  
  const { restaurant, categories } = data;
  const activeItems = categories.find(c => c.id === activeCategory)?.items || [];
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-primary text-white p-4 text-center rounded-t-lg">
          <div className="font-lato font-bold text-xl">{restaurant.name}</div>
          <div className="font-lato text-sm mt-1">
            {restaurant.category ? (
              restaurant.category === "italian" ? "Cucina italiana tradizionale" :
              restaurant.category === "japanese" ? "Cucina giapponese" :
              restaurant.category === "pizza" ? "Pizzeria" :
              restaurant.category === "seafood" ? "Cucina di pesce" :
              restaurant.category === "steakhouse" ? "Specialità di carne" :
              restaurant.category === "vegan" ? "Cucina vegana" :
              restaurant.category
            ) : "Menu digitale"}
          </div>
        </div>
        
        {/* Menu Navigation */}
        <div className="flex border-b border-neutral-100 dark:border-gray-700 overflow-x-auto whitespace-nowrap p-2 bg-white dark:bg-gray-800">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-3 py-1 rounded-lg mr-2 font-lato text-sm ${
                activeCategory === category.id
                  ? "bg-accent text-white"
                  : "hover:bg-neutral-100 dark:hover:bg-gray-700 text-neutral-300 dark:text-gray-400"
              }`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Menu Section */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg shadow-sm">
          <h4 className="font-lato font-bold text-primary dark:text-white">
            {categories.find(c => c.id === activeCategory)?.name || "Menu"}
          </h4>
          
          <div className="mt-4 space-y-4">
            {activeItems.length === 0 ? (
              <div className="text-center py-8 text-neutral-300 dark:text-gray-500">
                Nessun piatto in questa categoria
              </div>
            ) : (
              activeItems.map((item) => (
                <div 
                  key={item.id} 
                  className="flex border-b border-neutral-100 dark:border-gray-700 pb-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors rounded-lg p-2 -m-2"
                  onClick={() => trackMenuItemView(item.id)}
                >
                  <div className="h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.imageUrl || "https://via.placeholder.com/150?text=Piatto"} 
                      alt={item.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <h5 className="font-lato font-bold text-primary dark:text-white">{item.name}</h5>
                      <span className="font-lato font-bold text-accent">{item.price}</span>
                    </div>
                    <p className="text-sm text-neutral-300 dark:text-gray-400 mt-1 font-lato">
                      {item.description || ""}
                    </p>
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex mt-2 flex-wrap gap-1">
                        {item.allergens.map((allergen) => (
                          <Badge 
                            key={allergen.id} 
                            variant="outline"
                            className="bg-neutral-100 dark:bg-gray-700 text-xs px-2 py-1 rounded-full text-neutral-300 dark:text-gray-400"
                          >
                            {allergen.icon && (
                              <span dangerouslySetInnerHTML={{ __html: allergen.icon }} className="mr-1" />
                            )}
                            {allergen.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-neutral-100 dark:bg-gray-700 p-3 text-center rounded-lg mt-6">
          <div className="text-xs text-neutral-300 dark:text-gray-400 font-lato">
            Menu aggiornato il {new Date(restaurant.updatedAt || Date.now()).toLocaleDateString()}
          </div>
          <div className="text-xs text-accent font-lato mt-1">
            Powered by MenuIsland
          </div>
          <div className="text-xs text-neutral-300 dark:text-gray-400 font-lato mt-1">
            P.IVA: 01687960912
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantView;
