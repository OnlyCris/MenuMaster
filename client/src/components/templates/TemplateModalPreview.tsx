import { useState } from "react";
import { Template } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type TemplateModalPreviewProps = {
  template: Template;
  onSelect?: (template: Template) => void;
};

type ColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
};

const predefinedPalettes: { name: string; colors: ColorPalette }[] = [
  {
    name: "Originale",
    colors: {
      primary: "#2C3E50",
      secondary: "#E8F4FD", 
      accent: "#3498DB",
      text: "#2C3E50",
      background: "#FFFFFF"
    }
  },
  {
    name: "Rustico",
    colors: {
      primary: "#8B4513",
      secondary: "#F5DEB3",
      accent: "#CD853F", 
      text: "#5D4037",
      background: "#FFF8E1"
    }
  },
  {
    name: "Moderno",
    colors: {
      primary: "#1A202C",
      secondary: "#F7FAFC",
      accent: "#4299E1",
      text: "#2D3748", 
      background: "#FFFFFF"
    }
  },
  {
    name: "Natura",
    colors: {
      primary: "#22543D",
      secondary: "#F0FFF4",
      accent: "#68D391",
      text: "#2F855A",
      background: "#F7FFFC"
    }
  }
];

export const TemplateModalPreview = ({ template, onSelect }: TemplateModalPreviewProps) => {
  const [selectedPalette, setSelectedPalette] = useState(0);
  const currentColors = predefinedPalettes[selectedPalette].colors;

  const getTemplateStyle = (templateName: string, colors: ColorPalette) => {
    const baseStyles = {
      fontFamily: "'Inter', sans-serif",
      color: colors.text,
      backgroundColor: colors.background
    };

    switch (templateName.toLowerCase()) {
      case "template elegante":
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
          borderRadius: "12px"
        };
      case "template rustico": 
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
          borderRadius: "8px",
          border: `2px solid ${colors.accent}`
        };
      case "template moderno":
        return {
          ...baseStyles,
          background: `linear-gradient(45deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
          borderRadius: "16px"
        };
      default:
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
        };
    }
  };

  const headerStyle = getTemplateStyle(template.name, currentColors);

  return (
    <div className="space-y-6">
      {/* Template info */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          )}
        </div>
        <div className="flex gap-1">
          {template.isPopular && (
            <Badge variant="secondary" className="text-xs">
              Popolare
            </Badge>
          )}
          {template.isNew && (
            <Badge variant="outline" className="text-xs">
              Nuovo
            </Badge>
          )}
        </div>
      </div>

      {/* Template preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm border rounded-lg overflow-hidden shadow-sm">
          {/* Header */}
          <div 
            className="text-white p-4 text-center"
            style={headerStyle}
          >
            <div className="font-bold text-lg">Ristorante Demo</div>
            <div className="text-sm opacity-90">Menu digitale</div>
          </div>

          {/* Menu Categories */}
          <div className="p-3" style={{ backgroundColor: currentColors.background }}>
            <div className="flex gap-2 mb-3">
              {["Antipasti", "Primi", "Secondi"].map((cat, idx) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: idx === 0 ? currentColors.accent : currentColors.secondary,
                    color: idx === 0 ? "white" : currentColors.text
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Sample Menu Items */}
            <div className="space-y-2">
              {[
                { name: "Bruschetta al pomodoro", price: "€8.00" },
                { name: "Pasta alla carbonara", price: "€12.00" },
                { name: "Risotto ai funghi", price: "€14.00" }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded"
                  style={{
                    backgroundColor: template.name.toLowerCase().includes("rustico") 
                      ? currentColors.secondary 
                      : currentColors.background,
                    border: template.name.toLowerCase().includes("elegante")
                      ? `1px solid ${currentColors.secondary}`
                      : "none"
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm" style={{ color: currentColors.text }}>
                        {item.name}
                      </div>
                      <div className="text-xs opacity-70" style={{ color: currentColors.text }}>
                        Descrizione del piatto...
                      </div>
                    </div>
                    <div className="font-bold text-sm" style={{ color: currentColors.primary }}>
                      {item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-3 pt-2 border-t" style={{ borderColor: currentColors.secondary }}>
              <div className="text-xs" style={{ color: currentColors.text, opacity: 0.7 }}>
                Powered by MenuIsland
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Selector */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Palette colori:</div>
        <div className="grid grid-cols-2 gap-2">
          {predefinedPalettes.map((palette, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPalette(idx)}
              className={`p-2 rounded border text-left transition-colors ${
                selectedPalette === idx 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-xs font-medium mb-1">{palette.name}</div>
              <div className="flex gap-1">
                {Object.values(palette.colors).slice(0, 4).map((color, colorIdx) => (
                  <div
                    key={colorIdx}
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      {onSelect && (
        <Button 
          onClick={() => onSelect(template)}
          className="w-full"
        >
          Seleziona Template
        </Button>
      )}
    </div>
  );
};