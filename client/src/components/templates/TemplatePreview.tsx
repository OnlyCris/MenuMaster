import { useState } from "react";
import { Template } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Palette, Star, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TemplatePreviewProps = {
  template: Template;
  onSelect?: (template: Template) => void;
  selected?: boolean;
  showSelectButton?: boolean;
};

const TemplatePreview = ({ template, onSelect, selected, showSelectButton = true }: TemplatePreviewProps) => {
  const [showPreview, setShowPreview] = useState(false);

  // Parse color scheme safely
  const getColorScheme = () => {
    try {
      return template.colorScheme ? JSON.parse(template.colorScheme) : null;
    } catch {
      return null;
    }
  };

  const colorScheme = getColorScheme();

  // Generate mock menu data for preview
  const mockRestaurant = {
    name: "Ristorante Demo",
    location: "Via Roma, 123 - Milano",
    logoUrl: null
  };

  const mockCategories = [
    {
      id: 1,
      name: "Antipasti",
      description: "Selezione di antipasti della casa",
      items: [
        {
          id: 1,
          name: "Bruschetta al Pomodoro",
          description: "Pane tostato con pomodori freschi, basilico e olio extravergine",
          price: "€8.50",
          imageUrl: null,
          allergens: [{ name: "Glutine" }]
        },
        {
          id: 2,
          name: "Antipasto Misto",
          description: "Selezione di salumi e formaggi locali con verdure grigliate",
          price: "€12.00",
          imageUrl: null,
          allergens: [{ name: "Lattosio" }]
        }
      ]
    },
    {
      id: 2,
      name: "Primi Piatti",
      description: "Pasta fresca fatta in casa",
      items: [
        {
          id: 3,
          name: "Spaghetti alla Carbonara",
          description: "Pasta con uova, pecorino, guanciale e pepe nero",
          price: "€14.00",
          imageUrl: null,
          allergens: [{ name: "Glutine" }, { name: "Uova" }]
        }
      ]
    }
  ];

  const PreviewContent = () => (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Apply template styles */}
      <style>
        {template.cssStyles}
      </style>
      
      {/* Restaurant Header */}
      <header className="restaurant-header bg-blue-600 text-white p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">{mockRestaurant.name}</h1>
        <p className="text-sm opacity-90">{mockRestaurant.location}</p>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto p-6 max-w-4xl">
        {mockCategories.map((category) => (
          <section key={category.id} className="mb-8">
            <div className="menu-category p-4 rounded-lg mb-4">
              <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
              <p className="text-gray-600 text-sm">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {category.items.map((item) => (
                <div key={item.id} className="menu-item border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <span className="price font-bold">{item.price}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map((allergen, idx) => (
                      <span 
                        key={idx}
                        className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded"
                      >
                        {allergen.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );

  return (
    <>
      <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${selected ? 'ring-2 ring-blue-500' : ''}`}>
        <CardContent className="p-6">
          {/* Template Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {template.description || "Template per menu digitale"}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {template.isPopular && (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  <Star className="h-3 w-3 mr-1" />
                  Popolare
                </Badge>
              )}
              {template.isNew && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Nuovo
                </Badge>
              )}
            </div>
          </div>

          {/* Color Scheme Preview */}
          {colorScheme && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Schema Colori
              </p>
              <div className="flex space-x-2">
                {Object.entries(colorScheme).slice(0, 4).map(([key, color]) => (
                  <div key={key} className="flex flex-col items-center">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: color as string }}
                      title={`${key}: ${color}`}
                    />
                    <span className="text-xs text-gray-500 mt-1 capitalize">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 overflow-hidden">
            <div className="scale-50 origin-top-left w-[200%] h-32 overflow-hidden">
              <div className="transform scale-50">
                <PreviewContent />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Anteprima
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Anteprima Template: {template.name}
                  </DialogTitle>
                  <DialogDescription>
                    Ecco come apparirà il menu del ristorante con questo template
                  </DialogDescription>
                </DialogHeader>
                
                <div className="border rounded-lg overflow-hidden">
                  <PreviewContent />
                </div>
              </DialogContent>
            </Dialog>

            {showSelectButton && onSelect && (
              <Button 
                onClick={() => onSelect(template)}
                size="sm"
                className="flex-1"
                variant={selected ? "default" : "outline"}
              >
                {selected ? "Selezionato" : "Seleziona"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TemplatePreview;