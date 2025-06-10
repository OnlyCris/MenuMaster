import { useQuery } from "@tanstack/react-query";
import { Restaurant, Template, Category, MenuItem, Allergen } from "@shared/schema";
import { useEffect, useState } from "react";
import { Loader2, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// Types for the menu data
type MenuData = {
  restaurant: Restaurant;
  template: Template | null;
  categories: (Category & { items: (MenuItem & { allergens: Allergen[] })[] })[];
};

// Supported languages
const SUPPORTED_LANGUAGES = {
  'it': 'Italiano',
  'en': 'English',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'pt': 'Português',
  'ru': 'Русский',
  'zh': '中文',
  'ja': '日本語',
  'ar': 'العربية'
};

const RestaurantMenu = () => {
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('it');

  // Check if we're on a restaurant subdomain
  useEffect(() => {
    const host = window.location.hostname;
    setIsSubdomain(host.includes(".menuisland.it") && !host.startsWith("www."));
  }, []);

  // Detect browser language on component mount
  useEffect(() => {
    const browserLang = navigator.language.substring(0, 2);
    if (browserLang in SUPPORTED_LANGUAGES) {
      setSelectedLanguage(browserLang);
    }
  }, []);

  // Fetch menu data if on a subdomain
  const { data: menuData, isLoading, error } = useQuery<MenuData>({
    queryKey: ["/api/menu", selectedLanguage],
    queryFn: async () => {
      const subdomain = window.location.hostname.split('.')[0];
      const response = await fetch(`/api/menu/${subdomain}?lang=${selectedLanguage}`);
      if (!response.ok) throw new Error('Failed to fetch menu');
      return response.json();
    },
    enabled: isSubdomain,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Caricamento del menu...</h2>
      </div>
    );
  }

  // Error state
  if (error || !menuData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Menu non disponibile</h2>
        <p className="text-gray-600 max-w-md">
          Ci dispiace, ma non siamo riusciti a caricare il menu del ristorante. 
          Potrebbe essere un problema temporaneo. Riprova più tardi o contatta il ristorante.
        </p>
      </div>
    );
  }

  // Not a subdomain - show information
  if (!isSubdomain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Menu Island</h1>
        <p className="text-gray-600 max-w-md mb-6">
          Questa è la piattaforma di gestione menu per ristoranti. 
          Per visualizzare il menu di un ristorante specifico, utilizza il link fornito dal ristorante.
        </p>
      </div>
    );
  }

  // Apply the template styles if available
  const templateStyles = menuData.template?.cssStyles || "";

  return (
    <>
      {/* Inject template styles */}
      {templateStyles && <style>{templateStyles}</style>}
      
      <div className="min-h-screen bg-white">
        {/* Restaurant header */}
        <header className="bg-primary text-white p-4 md:p-6 text-center relative">
          {/* Language selector */}
          <div className="absolute top-2 right-2 md:top-4 md:right-4">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-24 md:w-32 bg-white/10 border-white/20 text-white text-xs md:text-sm">
                <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {menuData.restaurant.logoUrl && (
            <img 
              src={menuData.restaurant.logoUrl} 
              alt={`${menuData.restaurant.name} logo`} 
              className="h-16 md:h-24 mx-auto mb-3 md:mb-4 object-contain"
            />
          )}
          <h1 className="text-xl md:text-3xl font-bold px-8">{menuData.restaurant.name}</h1>
          {menuData.restaurant.location && (
            <p className="mt-2 text-xs md:text-sm px-4">{menuData.restaurant.location}</p>
          )}
        </header>
      
        {/* Menu content */}
        <main className="container mx-auto p-3 md:p-6 max-w-4xl">
          {menuData.categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nessuna categoria disponibile nel menu.</p>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-10">
              {menuData.categories
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((category) => (
                  <section key={category.id} className="mb-6 md:mb-8">
                    <h2 className="text-xl md:text-2xl font-bold border-b border-gray-200 pb-2 mb-3 md:mb-4">
                      {category.name}
                    </h2>
                    {category.description && (
                      <p className="text-gray-600 mb-3 md:mb-4 text-sm md:text-base">{category.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      {category.items
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((item) => (
                          <div key={item.id} className="border border-gray-100 rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow bg-white">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-base md:text-lg font-semibold flex-1 pr-2">{item.name}</h3>
                              <span className="text-base md:text-lg font-medium text-primary whitespace-nowrap">
                                {item.price}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-gray-600 text-xs md:text-sm mt-1 mb-2 leading-relaxed">{item.description}</p>
                            )}
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-full h-32 md:h-48 object-cover rounded-md mt-2 md:mt-3"
                              />
                            )}
                            {item.allergens.length > 0 && (
                              <div className="mt-2 md:mt-3">
                                <h4 className="text-xs uppercase text-gray-500 mb-1">Allergeni:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {item.allergens.map((allergen) => (
                                    <span 
                                      key={allergen.id} 
                                      className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded"
                                      title={allergen.description || ""}
                                    >
                                      {allergen.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </main>
      
        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          <p>Menu gestito con ❤️ da <a href="https://menuisland.it" className="text-primary hover:underline">Menu Island</a></p>
        </footer>
      </div>
    </>
  );
};

export default RestaurantMenu;