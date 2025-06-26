import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Allergen, InsertAllergen } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Edit, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const allergenSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  icon: z.string().optional(),
  description: z.string().optional(),
});

type AllergenFormData = z.infer<typeof allergenSchema>;

const AllergenManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(null);
  
  // Fetch allergens
  const { data: allergens = [], isLoading } = useQuery<Allergen[]>({
    queryKey: ["/api/allergens"],
  });
  
  // Form
  const form = useForm<AllergenFormData>({
    resolver: zodResolver(allergenSchema),
    defaultValues: {
      name: "",
      icon: "",
      description: "",
    },
  });
  
  // Mutations
  const createAllergenMutation = useMutation({
    mutationFn: async (data: InsertAllergen) => {
      return await apiRequest("POST", "/api/allergens", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergens"] });
      form.reset({
        name: "",
        icon: "",
        description: "",
      });
      setIsAllergenModalOpen(false);
      toast({
        title: "Allergene creato",
        description: "L'allergene è stato creato con successo",
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
  
  const updateAllergenMutation = useMutation({
    mutationFn: async (data: { id: number; allergen: Partial<InsertAllergen> }) => {
      return await apiRequest("PUT", `/api/allergens/${data.id}`, data.allergen);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergens"] });
      form.reset();
      setIsAllergenModalOpen(false);
      setSelectedAllergen(null);
      toast({
        title: "Allergene aggiornato",
        description: "L'allergene è stato aggiornato con successo",
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
  
  const deleteAllergenMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/allergens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergens"] });
      toast({
        title: "Allergene eliminato",
        description: "L'allergene è stato eliminato con successo",
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
  const handleAllergenSubmit = async (data: AllergenFormData) => {
    if (selectedAllergen) {
      await updateAllergenMutation.mutate({ id: selectedAllergen.id, allergen: data });
    } else {
      await createAllergenMutation.mutate(data as InsertAllergen);
    }
  };
  
  // Edit handlers
  const handleEditAllergen = (allergen: Allergen) => {
    setSelectedAllergen(allergen);
    form.reset({
      name: allergen.name,
      icon: allergen.icon || "",
      description: allergen.description || "",
    });
    setIsAllergenModalOpen(true);
  };
  
  // New item handlers
  const handleNewAllergen = () => {
    setSelectedAllergen(null);
    form.reset({
      name: "",
      icon: "",
      description: "",
    });
    setIsAllergenModalOpen(true);
  };
  
  // Helper for icons
  const renderIconPreview = (icon: string | null | undefined) => {
    if (!icon) return null;
    
    return (
      <div
        className="w-6 h-6 inline-flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <CardTitle className="text-lg md:text-xl">Gestione Allergeni</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Crea e gestisci gli allergeni che possono essere assegnati ai piatti
            </CardDescription>
          </div>
          <Button onClick={handleNewAllergen} className="text-sm">
            <Plus className="h-4 w-4 mr-2" /> Nuovo Allergene
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allergens.length === 0 ? (
            <div className="text-center py-12 border rounded-md">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nessun allergene trovato</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Inizia aggiungendo il tuo primo allergene!
              </p>
            </div>
          ) : (
            /* Mobile-optimized card layout */
            <div className="space-y-3 md:space-y-4">
              {allergens.map((allergen) => (
                <Card key={allergen.id} className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1">
                        {renderIconPreview(allergen.icon) || (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-500">?</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm md:text-base truncate">{allergen.name}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {allergen.description || <span className="italic">Nessuna descrizione</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAllergen(allergen)}
                        className="h-8 w-8 md:h-9 md:w-9 p-0"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 md:h-9 md:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm md:text-base">Sei sicuro?</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs md:text-sm">
                              Questa azione non può essere annullata. L'allergene "{allergen.name}" verrà eliminato definitivamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
                            <AlertDialogCancel className="text-sm">Annulla</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAllergenMutation.mutate(allergen.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
                            >
                              Elimina
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Allergen Modal */}
      <Dialog open={isAllergenModalOpen} onOpenChange={setIsAllergenModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAllergen ? "Modifica Allergene" : "Nuovo Allergene"}
            </DialogTitle>
            <DialogDescription>
              {selectedAllergen
                ? "Modifica i dettagli dell'allergene"
                : "Aggiungi un nuovo allergene alla lista"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAllergenSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Es. Glutine" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icona (HTML/SVG)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder='Es. <i class="fas fa-wheat-awn"></i>'
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2 p-2 border rounded-md">
                        <p className="text-sm font-medium mb-1">Anteprima:</p>
                        <div className="h-6 w-6">
                          {renderIconPreview(field.value)}
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Inserisci una descrizione per questo allergene"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAllergenModalOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={createAllergenMutation.isPending || updateAllergenMutation.isPending}>
                  {createAllergenMutation.isPending || updateAllergenMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllergenManager;
