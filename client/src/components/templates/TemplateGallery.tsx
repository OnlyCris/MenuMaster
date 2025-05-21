import { useQuery } from "@tanstack/react-query";
import { Template } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type TemplateCardProps = {
  template: Template;
  onSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
};

const TemplateCard = ({ template, onSelect, onPreview }: TemplateCardProps) => {
  return (
    <div className="template-card rounded-lg border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={template.thumbnailUrl || "https://via.placeholder.com/600x400?text=Template"} 
          alt={template.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-primary bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Button 
            className="px-4 py-2 bg-white text-primary rounded-lg font-opensans font-medium"
            onClick={() => onPreview(template)}
          >
            Anteprima
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h4 className="font-poppins font-medium text-primary">{template.name}</h4>
        <p className="text-sm text-neutral-300">{template.description}</p>
        <div className="mt-4 flex justify-between items-center">
          {template.isPopular && (
            <span className="text-sm font-opensans font-medium text-success">Popolare</span>
          )}
          {template.isNew && (
            <span className="text-sm font-opensans font-medium text-accent">Nuovo</span>
          )}
          {!template.isPopular && !template.isNew && (
            <span className="text-sm font-opensans font-medium text-neutral-300"></span>
          )}
          <Button 
            variant="outline"
            className="px-3 py-1 text-sm border-accent text-accent hover:bg-accent hover:text-white transition-colors"
            onClick={() => onSelect(template)}
          >
            Seleziona
          </Button>
        </div>
      </div>
    </div>
  );
};

type TemplateGalleryProps = {
  onSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
  limit?: number;
};

const TemplateGallery = ({ onSelect, onPreview, limit }: TemplateGalleryProps) => {
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });
  
  const displayTemplates = limit ? templates.slice(0, limit) : templates;
  
  return (
    <Card className="shadow-sm overflow-hidden mb-8">
      <CardHeader className="border-b border-neutral-100 px-6 py-6">
        <CardTitle className="text-lg font-poppins font-semibold text-primary">
          Template disponibili
        </CardTitle>
        <CardDescription className="text-sm text-neutral-300 mt-1">
          Scegli tra i nostri template professionali per i menu digitali
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(limit || 3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-neutral-100 overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <div className="mt-4 flex justify-between items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={onSelect}
                onPreview={onPreview}
              />
            ))}
          </div>
        )}
        
        {limit && templates.length > limit && (
          <div className="border-t border-neutral-100 pt-6 mt-6 flex justify-center">
            <Button variant="link" className="text-accent font-opensans flex items-center">
              Vedi tutti i template 
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateGallery;
