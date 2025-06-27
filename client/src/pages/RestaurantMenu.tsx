import { useQuery, useMutation } from "@tanstack/react-query";
import { Restaurant, Template, Category, MenuItem, Allergen } from "@shared/schema";
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Loader2, Globe, Star, Utensils, MapPin, Phone, Clock, Wifi, Car, Heart, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  const params = useParams();
  const [selectedLanguage, setSelectedLanguage] = useState('it');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [restaurantId, setRestaurantId] = useState<number | null>(null);

  // Get restaurant name from URL parameter
  const restaurantName = params.restaurantName;
  const isDirectAccess = !!restaurantName;

  // Detect browser language on component mount
  useEffect(() => {
    const browserLang = navigator.language.substring(0, 2);
    if (browserLang in SUPPORTED_LANGUAGES) {
      setSelectedLanguage(browserLang);
    }
  }, []);

  // Track menu item view mutation
  const trackViewMutation = useMutation({
    mutationFn: async ({ restaurantId, menuItemId }: { restaurantId: number, menuItemId: number }) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/track-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId, language: selectedLanguage })
      });
      return response.json();
    }
  });

  // Track language usage mutation
  const trackLanguageMutation = useMutation({
    mutationFn: async ({ restaurantId, language }: { restaurantId: number, language: string }) => {
      const response = await fetch(`/api/restaurants/${restaurantId}/track-language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      });
      return response.json();
    }
  });

  // Toggle category expansion
  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Toggle favorite item
  const toggleFavorite = (itemId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  // Track menu item view
  const handleItemView = (menuItemId: number) => {
    if (restaurantId) {
      trackViewMutation.mutate({ restaurantId, menuItemId });
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    if (restaurantId) {
      trackLanguageMutation.mutate({ restaurantId, language: newLanguage });
    }
  };

  // Fetch menu data if restaurant name is provided
  const { data: menuData, isLoading, error } = useQuery<MenuData>({
    queryKey: ["/api/view", restaurantName, selectedLanguage],
    queryFn: async () => {
      if (!restaurantName) {
        throw new Error("Restaurant name is required");
      }
      const response = await fetch(`/api/view/${restaurantName}?lang=${selectedLanguage}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!restaurantName && isDirectAccess,
    retry: 2
  });

  // Set restaurant ID when data loads
  useEffect(() => {
    if (menuData?.restaurant?.id) {
      setRestaurantId(menuData.restaurant.id);
      // Expand all categories by default
      setExpandedCategories(new Set(menuData.categories.map(c => c.id)));
    }
  }, [menuData]);

  if (!isDirectAccess || !restaurantName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <Utensils className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Menu Island</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Questa è la piattaforma di gestione menu per ristoranti. 
            Per visualizzare il menu di un ristorante specifico, utilizza il link fornito dal ristorante.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              <span>Multilingue</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              <span>Digitale</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento menu...</p>
        </div>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-600 mb-4">
            <Utensils className="h-16 w-16 mx-auto mb-2" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Menu non disponibile</h2>
          <p className="text-gray-600 mb-6">
            Non è possibile caricare il menu in questo momento. 
            Riprova più tardi o contatta il ristorante.
          </p>
        </div>
      </div>
    );
  }

  // Apply the template styles if available
  const templateStyles = menuData.template?.cssStyles || "";

  return (
    <>
      {/* Inject template styles */}
      {templateStyles && <style>{templateStyles}</style>}
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-20">
              {/* Restaurant Info */}
              <div className="flex items-center space-x-3">
                {menuData.restaurant.logoUrl && (
                  <img 
                    src={menuData.restaurant.logoUrl} 
                    alt={`${menuData.restaurant.name} logo`} 
                    className="h-8 w-8 sm:h-12 sm:w-12 object-contain rounded-full"
                  />
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-40 sm:max-w-none">
                    {menuData.restaurant.name}
                  </h1>
                  {menuData.restaurant.location && (
                    <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {menuData.restaurant.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Language selector */}
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-20 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm">
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        <span className="text-xs sm:text-sm">{name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">
              Menu Digitale
            </h2>
            <p className="text-sm sm:text-lg opacity-90 max-w-2xl mx-auto">
              Scopri i nostri piatti preparati con ingredienti freschi e ricette tradizionali
            </p>
            
            {/* Restaurant Features */}
            <div className="flex justify-center items-center space-x-4 sm:space-x-8 mt-4 sm:mt-8 text-xs sm:text-sm">
              <div className="flex items-center">
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>WiFi Gratis</span>
              </div>
              <div className="flex items-center">
                <Car className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Parcheggio</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span>Servizio Veloce</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="sticky top-16 sm:top-20 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto py-3 sm:py-4 scrollbar-hide">
              {menuData.categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => document.getElementById(`category-${category.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all whitespace-nowrap"
                >
                  <Utensils className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      
        {/* Menu Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {menuData.categories.length === 0 ? (
            <div className="text-center py-16 sm:py-24">
              <Utensils className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">Menu in preparazione</h3>
              <p className="text-sm sm:text-base text-gray-500">Il nostro menu sarà disponibile a breve</p>
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-16">
              {menuData.categories
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((category) => (
                  <section key={category.id} id={`category-${category.id}`} className="scroll-mt-32">
                    {/* Category Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-8">
                      <div>
                        <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-sm sm:text-base text-gray-600 max-w-2xl">
                            {category.description}
                          </p>
                        )}
                      </div>
                      
                      {/* Mobile Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(category.id)}
                        className="sm:hidden"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Menu Items */}
                    <div className={`${!expandedCategories.has(category.id) ? 'hidden sm:block' : ''}`}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {category.items
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((item) => (
                            <Card 
                              key={item.id} 
                              className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm hover:shadow-xl"
                              onClick={() => handleItemView(item.id)}
                            >
                              <CardContent className="p-0">
                                {/* Item Image */}
                                {item.imageUrl && (
                                  <div className="relative overflow-hidden rounded-t-lg">
                                    <img 
                                      src={item.imageUrl} 
                                      alt={item.name} 
                                      className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-2 right-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleFavorite(item.id);
                                        }}
                                        className="bg-white/80 hover:bg-white/90 backdrop-blur-sm p-2"
                                      >
                                        <Heart 
                                          className={`h-4 w-4 ${
                                            favorites.has(item.id) 
                                              ? 'fill-red-500 text-red-500' 
                                              : 'text-gray-600'
                                          }`}
                                        />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Item Content */}
                                <div className="p-4 sm:p-6">
                                  <div className="flex justify-between items-start mb-2 sm:mb-3">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 pr-2 group-hover:text-blue-600 transition-colors">
                                      {item.name}
                                    </h3>
                                    <div className="text-right">
                                      <span className="text-lg sm:text-xl font-bold text-blue-600">
                                        {item.price}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {item.description && (
                                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                                      {item.description}
                                    </p>
                                  )}
                                  
                                  {/* Allergens */}
                                  {item.allergens.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                        Allergeni
                                      </h4>
                                      <div className="flex flex-wrap gap-1 sm:gap-2">
                                        {item.allergens.map((allergen) => (
                                          <Badge 
                                            key={allergen.id} 
                                            variant="secondary"
                                            className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200"
                                            title={allergen.description || ""}
                                          >
                                            {allergen.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </section>
                ))}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{menuData.restaurant.name}</h3>
              {menuData.restaurant.location && (
                <p className="text-sm text-gray-400 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  {menuData.restaurant.location}
                </p>
              )}
            </div>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-xs text-gray-500">
                Powered by Menu Island - Piattaforma digitale per ristoranti
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default RestaurantMenu;