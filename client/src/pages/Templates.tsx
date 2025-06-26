import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Template, InsertTemplate } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import TemplateGallery from "@/components/templates/TemplateGallery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const templateSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  cssStyles: z.string().optional(),
  isPopular: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

type TemplateFormData = z.infer<typeof templateSchema>;

const Templates = () => {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Fetch templates
  const { data: templates = [], isLoading: isTemplatesLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
    enabled: isAuthenticated,
  });
  
  // Form setup
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      thumbnailUrl: "",
      cssStyles: "",
      isPopular: false,
      isNew: false,
    },
  });
  
  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: InsertTemplate) => {
      return await apiRequest("POST", "/api/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      form.reset();
      setIsTemplateModalOpen(false);
      toast({
        title: "Template creato",
        description: "Il template è stato creato con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });
  
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { id: number; template: Partial<InsertTemplate> }) => {
      return await apiRequest("PUT", `/api/templates/${data.id}`, data.template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      form.reset();
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
      toast({
        title: "Template aggiornato",
        description: "Il template è stato aggiornato con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });
  
  // Form handlers
  const handleTemplateSubmit = async (data: TemplateFormData) => {
    if (selectedTemplate) {
      await updateTemplateMutation.mutate({ id: selectedTemplate.id, template: data });
    } else {
      await createTemplateMutation.mutate(data as InsertTemplate);
    }
  };
  
  // Edit handlers
  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    form.reset({
      name: template.name,
      description: template.description || "",
      thumbnailUrl: template.thumbnailUrl || "",
      cssStyles: template.cssStyles || "",
      isPopular: template.isPopular || false,
      isNew: template.isNew || false,
    });
    setIsTemplateModalOpen(true);
  };
  
  // New template handler
  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    form.reset({
      name: "",
      description: "",
      thumbnailUrl: "",
      cssStyles: "",
      isPopular: false,
      isNew: true,
    });
    setIsTemplateModalOpen(true);
  };
  
  // Preview handler
  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  const [, setLocation] = useLocation();
  
  // If not authenticated and not loading, redirect to login
  if (!isAuthLoading && !isAuthenticated) {
    setLocation("/api/login");
    return null;
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar />
      
      <div className="flex-1 md:pl-64 overflow-y-auto">
        <Topbar 
          title="Template per Menu" 
          onNewRestaurantClick={handleNewTemplate}
          showNewButton={false}
        />
        
        <div className="p-3 md:p-6">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Template Disponibili</CardTitle>
                <CardDescription>
                  Gestisci i template per i menu dei ristoranti
                </CardDescription>
              </div>
              <Button onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-2" /> Nuovo Template
              </Button>
            </CardHeader>
            <CardContent>
              {isTemplatesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 border rounded-md">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nessun template trovato</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Inizia aggiungendo il tuo primo template!
                  </p>
                </div>
              ) : (
                <TemplateGallery 
                  onSelect={handleEditTemplate}
                  onPreview={() => {}}
                />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Guida ai Template</CardTitle>
              <CardDescription>
                Come utilizzare e personalizzare i template per i menu
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none dark:prose-invert">
              <h3>Cos'è un template?</h3>
              <p>
                Un template definisce l'aspetto visivo del menu digitale che verrà mostrato ai clienti.
                Ogni template ha uno stile unico, con colori, font e layout specifici.
              </p>
              
              <h3>Come funzionano i template?</h3>
              <p>
                Quando crei un ristorante, puoi selezionare uno dei template disponibili.
                Il menu digitale del ristorante utilizzerà lo stile del template scelto.
              </p>
              
              <h3>Personalizzazione</h3>
              <p>
                Gli amministratori possono creare nuovi template personalizzati aggiungendo CSS
                personalizzato. I ristoranti possono scegliere tra tutti i template disponibili.
              </p>
              
              <h3>Consigli per la scelta</h3>
              <ul>
                <li><strong>Elegante</strong>: Ideale per ristoranti raffinati e alta cucina</li>
                <li><strong>Minimal</strong>: Design pulito e moderno per evidenziare i piatti</li>
                <li><strong>Rustico</strong>: Perfetto per trattorie, pizzerie e locali dal carattere tradizionale</li>
                <li><strong>Moderno</strong>: Design contemporaneo con effetti e animazioni</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Template Form Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-lg">
              {selectedTemplate ? "Modifica Template" : "Nuovo Template"}
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              {selectedTemplate 
                ? "Modifica i dettagli del template" 
                : "Crea un nuovo template per i menu"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleTemplateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Es. Elegante" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder="Es. Design elegante per ristoranti sofisticati"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Anteprima</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Es. https://example.com/template-preview.jpg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cssStyles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CSS Personalizzato</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder=".menu-container { ... }"
                        className="font-mono text-sm h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Popolare</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Nuovo</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTemplateModalOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit"
                  disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending || updateTemplateMutation.isPending
                    ? "Salvataggio..."
                    : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Template Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Anteprima Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            {/* This would be a component that shows the template preview */}
            <div className="border rounded-lg p-4 w-full max-w-md">
              <div className="bg-primary text-white p-4 text-center rounded-t-lg">
                <h3 className="font-bold text-xl">Nome Ristorante</h3>
                <p className="text-sm">Cucina italiana tradizionale</p>
              </div>
              <div className="flex overflow-x-auto whitespace-nowrap p-2 border-b">
                <Button variant="default" size="sm" className="mr-2">Antipasti</Button>
                <Button variant="ghost" size="sm" className="mr-2">Primi</Button>
                <Button variant="ghost" size="sm" className="mr-2">Secondi</Button>
                <Button variant="ghost" size="sm">Dessert</Button>
              </div>
              
              <div className="p-4 space-y-4">
                <h4 className="font-bold">Antipasti</h4>
                
                <div className="flex border-b pb-4">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4">
                    <div className="flex justify-between">
                      <h5 className="font-bold">Nome Piatto</h5>
                      <span className="font-bold text-accent">€12.00</span>
                    </div>
                    <p className="text-sm text-neutral-300 my-1">Descrizione del piatto</p>
                    <div className="flex gap-1">
                      <span className="bg-neutral-100 text-xs px-2 py-1 rounded-full text-neutral-300">
                        Allergene 1
                      </span>
                      <span className="bg-neutral-100 text-xs px-2 py-1 rounded-full text-neutral-300">
                        Allergene 2
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="h-20 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4">
                    <div className="flex justify-between">
                      <h5 className="font-bold">Nome Piatto</h5>
                      <span className="font-bold text-accent">€9.50</span>
                    </div>
                    <p className="text-sm text-neutral-300 my-1">Descrizione del piatto</p>
                    <div className="flex gap-1">
                      <span className="bg-neutral-100 text-xs px-2 py-1 rounded-full text-neutral-300">
                        Allergene 1
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-100 p-3 text-center rounded-b-lg">
                <p className="text-xs text-neutral-300">Menu aggiornato il 01/07/2023</p>
                <p className="text-xs text-accent mt-1">Powered by MenuMaster</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={() => setIsPreviewModalOpen(false)}>Chiudi</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
