import { Template } from "@shared/schema";

type TemplateCardPreviewProps = {
  template: Template;
};

export const TemplateCardPreview = ({ template }: TemplateCardPreviewProps) => {
  const getTemplateColors = (templateName: string) => {
    switch (templateName.toLowerCase()) {
      case "template elegante":
        return {
          primary: "#2C3E50",
          secondary: "#E8F4FD", 
          accent: "#3498DB"
        };
      case "template rustico": 
        return {
          primary: "#8B4513",
          secondary: "#F5DEB3",
          accent: "#CD853F"
        };
      case "template moderno":
        return {
          primary: "#1A202C",
          secondary: "#F7FAFC",
          accent: "#4299E1"
        };
      case "template marino":
        return {
          primary: "#0F4C75",
          secondary: "#E3F2FD",
          accent: "#2196F3"
        };
      case "template vintage":
        return {
          primary: "#5D4037",
          secondary: "#FFF8E1",
          accent: "#FF8F00"
        };
      default:
        return {
          primary: "#2C3E50",
          secondary: "#E8F4FD",
          accent: "#3498DB"
        };
    }
  };

  const colors = getTemplateColors(template.name);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mini header */}
      <div 
        className="h-12 flex items-center justify-center text-white text-xs font-medium"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.accent} 100%)`
        }}
      >
        {template.name}
      </div>
      
      {/* Mini content area */}
      <div className="flex-1 p-3 bg-white">
        <div className="space-y-2">
          {/* Menu categories simulation */}
          <div className="flex gap-1">
            <div 
              className="px-2 py-1 rounded text-xs text-white"
              style={{ backgroundColor: colors.accent }}
            >
              Antipasti
            </div>
            <div 
              className="px-2 py-1 rounded text-xs"
              style={{ 
                backgroundColor: colors.secondary,
                color: colors.primary
              }}
            >
              Primi
            </div>
          </div>
          
          {/* Menu items simulation */}
          <div className="space-y-1">
            {[1, 2, 3].map(i => (
              <div 
                key={i}
                className="flex justify-between items-center p-1 rounded text-xs"
                style={{
                  backgroundColor: template.name.toLowerCase().includes("rustico") 
                    ? colors.secondary 
                    : "transparent",
                  borderLeft: template.name.toLowerCase().includes("elegante")
                    ? `2px solid ${colors.accent}`
                    : "none"
                }}
              >
                <div style={{ color: colors.primary }}>
                  Piatto {i}
                </div>
                <div className="font-bold" style={{ color: colors.primary }}>
                  €{8 + i}.00
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mini footer */}
      <div 
        className="h-6 flex items-center justify-center text-xs"
        style={{ 
          backgroundColor: colors.secondary,
          color: colors.primary
        }}
      >
        MenuIsland
      </div>
    </div>
  );
};