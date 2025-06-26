import { useState } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Category,
  MenuItem,
  InsertCategory,
  InsertMenuItem,
  Allergen,
} from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { CheckSquare, Edit, GripVertical, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const categorySchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
  restaurantId: z.number(),
  order: z.number().optional(),
});

const menuItemSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional(),
  price: z.string().min(1, "Il prezzo è obbligatorio"),
  imageUrl: z.string().optional(),
  categoryId: z.number(),
  order: z.number().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type MenuItemFormData = z.infer<typeof menuItemSchema>;

type MenuEditorProps = {
  restaurantId: number;
  onRefresh?: () => void;
};

const MenuEditor = ({ restaurantId, onRefresh }: MenuEditorProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
  const [selectedMenuItemForAllergens, setSelectedMenuItemForAllergens] = useState<MenuItem | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: [`/api/restaurants/${restaurantId}/categories`],
    enabled: !!restaurantId,
  });

  // Fetch menu items for the selected category
  const { data: menuItems = [], isLoading: isMenuItemsLoading } = useQuery<MenuItem[]>({
    queryKey: [`/api/categories/${selectedCategoryId}/menu-items`],
    enabled: !!selectedCategoryId,
  });
  
  // Fetch all allergens
  const { data: allergens = [], isLoading: isAllergensLoading } = useQuery<Allergen[]>({
    queryKey: ["/api/allergens"],
  });
  
  // Fetch allergens for a specific menu item
  const { data: menuItemAllergens = [], isLoading: isMenuItemAllergensLoading } = useQuery<Allergen[]>({
    queryKey: [`/api/menu-items/${selectedMenuItemForAllergens?.id}/allergens`],
    enabled: !!selectedMenuItemForAllergens,
  });

  // Forms
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      restaurantId,
      order: 0,
    },
  });

  const menuItemForm = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      categoryId: 0,
      order: 0,
    },
  });

  // Set default category when categories are loaded
  if (categories.length > 0 && !selectedCategoryId) {
    setSelectedCategoryId(categories[0].id);
  }

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      return await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
      categoryForm.reset({
        name: "",
        description: "",
        restaurantId,
        order: 0,
      });
      setIsCategoryModalOpen(false);
      toast({
        title: "Categoria creata",
        description: "La categoria è stata creata con successo",
      });
      if (onRefresh) onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: number; category: Partial<InsertCategory> }) => {
      return await apiRequest("PUT", `/api/categories/${data.id}`, data.category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
      categoryForm.reset();
      setIsCategoryModalOpen(false);
      setSelectedCategory(null);
      toast({
        title: "Categoria aggiornata",
        description: "La categoria è stata aggiornata con successo",
      });
      if (onRefresh) onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/categories`] });
      if (selectedCategoryId === selectedCategory?.id) {
        setSelectedCategoryId(categories[0]?.id || null);
      }
      toast({
        title: "Categoria eliminata",
        description: "La categoria è stata eliminata con successo",
      });
      if (onRefresh) onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: InsertMenuItem) => {
      return await apiRequest("POST", "/api/menu-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${selectedCategoryId}/menu-items`] });
      menuItemForm.reset({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        categoryId: selectedCategoryId || 0,
        order: 0,
      });
      setIsMenuItemModalOpen(false);
      toast({
        title: "Piatto creato",
        description: "Il piatto è stato creato con successo",
      });
      if (onRefresh) onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async (data: { id: number; menuItem: Partial<InsertMenuItem> }) => {
      return await apiRequest("PUT", `/api/menu-items/${data.id}`, data.menuItem);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${selectedCategoryId}/menu-items`] });
      menuItemForm.reset();
      setIsMenuItemModalOpen(false);
      setSelectedMenuItem(null);
      toast({
        title: "Piatto aggiornato",
        description: "Il piatto è stato aggiornato con successo",
      });
      if (onRefresh) onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/menu-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${selectedCategoryId}/menu-items`] });
      toast({
        title: "Piatto eliminato",
        description: "Il piatto è stato eliminato con successo",
      });
      if (onRefresh) onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Si è verificato un errore",
        variant: "destructive",
      });
    },
  });
  
  const toggleAllergenMutation = useMutation({
    mutationFn: async (data: { menuItemId: number; allergenId: number; isAdding: boolean }) => {
      if (data.isAdding) {
        return await apiRequest("POST", `/api/menu-items/${data.menuItemId}/allergens/${data.allergenId}`, {});
      } else {
        return await apiRequest("DELETE", `/api/menu-items/${data.menuItemId}/allergens/${data.allergenId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/menu-items/${selectedMenuItemForAllergens?.id}/allergens`] });
      toast({
        title: "Allergeni aggiornati",
        description: "Gli allergeni sono stati aggiornati con successo",
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

  // File upload handlers
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Form handlers
  const handleCategorySubmit = async (data: CategoryFormData) => {
    if (selectedCategory) {
      await updateCategoryMutation.mutate({ id: selectedCategory.id, category: data });
    } else {
      await createCategoryMutation.mutate(data as InsertCategory);
    }
  };

  const handleMenuItemSubmit = async (data: MenuItemFormData) => {
    let imageUrl = data.imageUrl;

    // Upload image if there's a file
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload image");
        }
        
        const result = await response.json();
        imageUrl = result.url;
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile caricare l'immagine",
          variant: "destructive",
        });
        return;
      }
    }

    const submitData = {
      ...data,
      imageUrl,
      categoryId: selectedCategoryId || data.categoryId,
    };

    if (selectedMenuItem) {
      await updateMenuItemMutation.mutate({ id: selectedMenuItem.id, menuItem: submitData });
    } else {
      await createMenuItemMutation.mutate(submitData as InsertMenuItem);
    }
  };

  // Edit handlers
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      restaurantId,
      order: category.order,
    });
    setIsCategoryModalOpen(true);
  };

  const handleEditMenuItem = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setFilePreview(menuItem.imageUrl || null);
    menuItemForm.reset({
      name: menuItem.name,
      description: menuItem.description || "",
      price: menuItem.price,
      imageUrl: menuItem.imageUrl || "",
      categoryId: menuItem.categoryId,
      order: menuItem.order,
    });
    setIsMenuItemModalOpen(true);
  };

  const handleManageAllergens = (menuItem: MenuItem) => {
    setSelectedMenuItemForAllergens(menuItem);
    setIsAllergenModalOpen(true);
  };
  
  const isAllergenSelected = (allergenId: number) => {
    return menuItemAllergens.some(a => a.id === allergenId);
  };
  
  const handleAllergenToggle = (allergenId: number, isChecked: boolean) => {
    if (!selectedMenuItemForAllergens) return;
    
    toggleAllergenMutation.mutate({
      menuItemId: selectedMenuItemForAllergens.id,
      allergenId,
      isAdding: isChecked
    });
  };

  // New item handlers
  const handleNewCategory = () => {
    setSelectedCategory(null);
    categoryForm.reset({
      name: "",
      description: "",
      restaurantId,
      order: categories.length,
    });
    setIsCategoryModalOpen(true);
  };

  const handleNewMenuItem = () => {
    if (!selectedCategoryId) {
      toast({
        title: "Nessuna categoria",
        description: "Seleziona prima una categoria",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedMenuItem(null);
    setFilePreview(null);
    setFile(null);
    menuItemForm.reset({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      categoryId: selectedCategoryId,
      order: menuItems.length,
    });
    setIsMenuItemModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg md:text-xl">Editor del Menu</CardTitle>
          <Button variant="outline" onClick={handleNewCategory} className="self-start md:self-auto">
            <Plus className="h-4 w-4 mr-2" /> Nuova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Categories panel */}
            <div className="w-full md:w-1/3 border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Categorie</h3>
              </div>
              
              {isCategoriesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessuna categoria. Crea la tua prima categoria!
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                        selectedCategoryId === category.id
                          ? "bg-accent/10 text-accent"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <span className="font-medium">{category.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                            <Edit className="h-4 w-4 mr-2" /> Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Menu items panel */}
            <div className="w-full md:w-2/3 border rounded-md p-4">
              <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-4">
                <h3 className="font-semibold text-base md:text-lg">
                  {selectedCategoryId
                    ? `Piatti in ${categories.find(c => c.id === selectedCategoryId)?.name || "Categoria"}`
                    : "Seleziona una categoria"}
                </h3>
                <Button 
                  onClick={handleNewMenuItem} 
                  disabled={!selectedCategoryId}
                  className="self-start md:self-auto"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" /> Nuovo Piatto
                </Button>
              </div>

              {!selectedCategoryId ? (
                <div className="text-center py-8 text-muted-foreground">
                  Seleziona una categoria per vedere i piatti
                </div>
              ) : isMenuItemsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun piatto in questa categoria. Aggiungi il tuo primo piatto!
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Immagine</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Prezzo</TableHead>
                          <TableHead>Allergeni</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menuItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="h-12 w-12 rounded overflow-hidden">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                    No img
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.price}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleManageAllergens(item)}
                              >
                                Gestisci
                              </Button>
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditMenuItem(item)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Modifica</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => deleteMenuItemMutation.mutate(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Elimina</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {menuItems.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex gap-3">
                          <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                No img
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-sm truncate">{item.name}</h4>
                              <span className="text-sm font-medium text-primary ml-2">{item.price}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex gap-1 flex-wrap">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleManageAllergens(item)}
                              >
                                Allergeni
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => handleEditMenuItem(item)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Modifica
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => deleteMenuItemMutation.mutate(item.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Elimina
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Modifica Categoria" : "Nuova Categoria"}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? "Modifica i dettagli della categoria"
                : "Aggiungi una nuova categoria al menu"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Es. Antipasti" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Inserisci una descrizione per questa categoria" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {createCategoryMutation.isPending || updateCategoryMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Menu Item Modal */}
      <Dialog open={isMenuItemModalOpen} onOpenChange={setIsMenuItemModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedMenuItem ? "Modifica Piatto" : "Nuovo Piatto"}
            </DialogTitle>
            <DialogDescription>
              {selectedMenuItem
                ? "Modifica i dettagli del piatto"
                : "Aggiungi un nuovo piatto al menu"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...menuItemForm}>
            <form onSubmit={menuItemForm.handleSubmit(handleMenuItemSubmit)} className="space-y-4">
              <FormField
                control={menuItemForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Es. Bruschetta al Pomodoro" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={menuItemForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prezzo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Es. €12.90" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={menuItemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Inserisci una descrizione per questo piatto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel className="block text-sm font-medium mb-1">
                  Immagine (opzionale)
                </FormLabel>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-neutral-200 rounded-lg">
                  <div className="space-y-1 text-center">
                    {filePreview ? (
                      <div className="mb-4">
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="mx-auto h-32 w-32 object-cover rounded-md"
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
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMenuItemModalOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending}>
                  {createMenuItemMutation.isPending || updateMenuItemMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Allergens Modal */}
      <Dialog open={isAllergenModalOpen} onOpenChange={setIsAllergenModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestisci Allergeni</DialogTitle>
            <DialogDescription>
              Seleziona gli allergeni presenti in "{selectedMenuItemForAllergens?.name}"
            </DialogDescription>
          </DialogHeader>
          
          {isAllergensLoading || isMenuItemAllergensLoading ? (
            <div className="py-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-2">
              {allergens.map((allergen) => (
                <div key={allergen.id} className="flex items-center space-x-2 py-2">
                  <Checkbox 
                    id={`allergen-${allergen.id}`} 
                    checked={isAllergenSelected(allergen.id)}
                    onCheckedChange={(checked) => handleAllergenToggle(allergen.id, checked as boolean)}
                    disabled={toggleAllergenMutation.isPending}
                  />
                  <label
                    htmlFor={`allergen-${allergen.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                  >
                    {allergen.icon && (
                      <span dangerouslySetInnerHTML={{ __html: allergen.icon }} className="mr-2 h-4 w-4 inline-block" />
                    )}
                    {allergen.name}
                  </label>
                </div>
              ))}
              
              {allergens.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nessun allergene disponibile
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsAllergenModalOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuEditor;
