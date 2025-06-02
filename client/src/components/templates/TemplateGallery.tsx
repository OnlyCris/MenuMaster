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
    <Card className="template-card overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700">
        {template.thumbnailUrl ? (
          <img 
            src={template.thumbnailUrl} 
            alt={template.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{template.name}</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            size="sm"
            className="bg-white/90 text-gray-900 hover:bg-white shadow-lg"
            onClick={() => onPreview(template)}
          >
            Anteprima
          </Button>
        </div>
        
        {/* Status badges */}
        {(template.isPopular || template.isNew) && (
          <div className="absolute top-3 left-3">
            {template.isPopular && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                ⭐ Popolare
              </span>
            )}
            {template.isNew && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-1">
                🆕 Nuovo
              </span>
            )}
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <CardHeader className="p-0 mb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</CardTitle>
          <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {template.description}
          </CardDescription>
        </CardHeader>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-1">
              <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white dark:border-gray-800" title="Rosso"></div>
              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800" title="Blu"></div>
              <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" title="Verde"></div>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Personalizzabile</span>
          </div>
          
          <Button 
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => onSelect(template)}
          >
            Seleziona
          </Button>
        </div>
      </CardContent>
    </Card>
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
