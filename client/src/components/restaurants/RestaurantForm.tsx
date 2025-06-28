import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Restaurant, Template, insertRestaurantSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Form-specific schema that uses strings for all select fields
const formSchema = z.object({
  name: z.string().min(1, "Il nome del ristorante è richiesto"),
  location: z.string().optional(),
  subdomain: z.string()
    .min(3, "Il sottodominio deve essere di almeno 3 caratteri")
    .max(30, "Il sottodominio non può superare i 30 caratteri")
    .regex(/^[a-z0-9-]+$/, "Solo lettere minuscole, numeri e trattini sono permessi"),
  ownerEmail: z.string().email("Email non valida"),
  templateId: z.string().optional(),
  category: z.string().optional(),
  logoUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type RestaurantFormProps = {
  restaurant?: Restaurant;
  onComplete: () => void;
};

const RestaurantForm = ({ restaurant, onComplete }: RestaurantFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(restaurant?.logoUrl || null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: restaurant?.name || "",
      location: restaurant?.location || "",
      subdomain: restaurant?.subdomain || "",
      ownerEmail: "",
      templateId: restaurant?.templateId?.toString() || "",
      category: restaurant?.category || "",
      logoUrl: restaurant?.logoUrl || "",
    },
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      let logoUrl = data.logoUrl;
      
      // Upload logo if there's a file
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload logo");
        }
        
        const result = await response.json();
        logoUrl = result.url;
      }
      
      // Create or update restaurant
      if (restaurant) {
        return await apiRequest("PUT", `/api/restaurants/${restaurant.id}`, {
          ...data,
          logoUrl,
          templateId: data.templateId ? parseInt(data.templateId) : null,
        });
      } else {
        return await apiRequest("POST", "/api/restaurants", {
          ...data,
          logoUrl,
          templateId: data.templateId ? parseInt(data.templateId) : null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: restaurant ? "Ristorante aggiornato" : "Ristorante creato",
        description: restaurant 
          ? "Il ristorante è stato aggiornato con successo" 
          : "Il ristorante è stato creato con successo. Ora puoi aggiungere il menu.",
        variant: "default",
      });
      onComplete();
    },
    onError: (error: any) => {
      let errorMessage = "Si è verificato un errore";
      
      // Se l'errore è un oggetto con error e message
      if (error && typeof error === 'object' && error.error && error.message) {
        if (error.error === 'RESTAURANT_LIMIT_REACHED') {
          errorMessage = "Hai raggiunto il limite di ristoranti per il tuo account. Contatta l'amministratore per aumentare il limite.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };
  
  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data);
  };
  
  return (
    <Card className="shadow-sm overflow-hidden mb-8">
      <CardHeader className="border-b border-neutral-100 px-6 py-6">
        <CardTitle className="text-lg font-poppins font-semibold text-primary">
          {restaurant ? "Modifica ristorante" : "Aggiungi un nuovo ristorante"}
        </CardTitle>
        <CardDescription className="text-sm text-neutral-300 mt-1">
          {restaurant 
            ? "Modifica i dettagli del ristorante" 
            : "Completa il form per creare un nuovo menu digitale"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-300">
                      Nome del ristorante
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Trattoria Bella Italia" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-300">
                      Località
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Es. Milano, Italia" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="subdomain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-300">
                      Sottodominio desiderato
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input 
                          placeholder="Es. bellaitalia" 
                          {...field} 
                          className="rounded-r-none"
                        />
                        <div className="bg-neutral-100 px-4 py-2 border border-l-0 border-neutral-200 rounded-r-lg text-neutral-300 flex items-center">
                          .menuisland.it
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-300">
                      Email del proprietario
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Es. proprietario@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-300">
                      Template del menu
                    </FormLabel>
                    <Select 
                      value={field.value || ""} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.length > 0 ? (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id.toString()}>
                              {template.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-templates">Nessun template disponibile</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-neutral-300">
                      Categoria ristorante
                    </FormLabel>
                    <Select 
                      value={field.value || ""} 
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="italian">Italiano</SelectItem>
                        <SelectItem value="japanese">Giapponese</SelectItem>
                        <SelectItem value="pizza">Pizzeria</SelectItem>
                        <SelectItem value="seafood">Pesce</SelectItem>
                        <SelectItem value="steakhouse">Carne</SelectItem>
                        <SelectItem value="vegan">Vegano</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormLabel className="block text-sm font-medium text-neutral-300 mb-1">
                Logo del ristorante
              </FormLabel>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-200 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {preview ? (
                    <div className="mb-4">
                      <img 
                        src={preview} 
                        alt="Logo preview" 
                        className="mx-auto h-32 w-32 object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    <svg 
                      className="mx-auto h-12 w-12 text-neutral-300" 
                      stroke="currentColor" 
                      fill="none" 
                      viewBox="0 0 48 48" 
                      aria-hidden="true"
                    >
                      <path 
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
                        strokeWidth={2} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                      />
                    </svg>
                  )}
                  
                  <div className="flex text-sm text-neutral-300 justify-center">
                    <label 
                      htmlFor="file-upload" 
                      className="relative cursor-pointer font-medium text-accent hover:text-accent/80"
                    >
                      <span>Carica un file</span>
                      <input 
                        id="file-upload" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">o trascina e rilascia</p>
                  </div>
                  <p className="text-xs text-neutral-300">
                    PNG, JPG, GIF fino a 5MB
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={onComplete}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                className="bg-accent text-white hover:bg-accent/80"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Salvataggio..." : (restaurant ? "Aggiorna" : "Crea Menu")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RestaurantForm;
