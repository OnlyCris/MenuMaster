import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Restaurant } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, QrCode, BarChart2, Trash2, Menu } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

type RestaurantListProps = {
  onEdit: (restaurant: Restaurant) => void;
  onGenerateQR: (restaurant: Restaurant) => void;
};

const RestaurantList = ({ onEdit, onGenerateQR }: RestaurantListProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  
  const { data: restaurants = [], isLoading, refetch } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });
  
  const handleDeleteRestaurant = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/restaurants/${id}`);
      toast({
        title: "Ristorante eliminato",
        description: "Il ristorante è stato eliminato con successo",
        variant: "default",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il ristorante",
        variant: "destructive",
      });
    }
  };


  
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
                          restaurant.subdomain.toLowerCase().includes(search.toLowerCase()) ||
                          (restaurant.location || "").toLowerCase().includes(search.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "active") return matchesSearch; // Implement actual status filtering when available
    return matchesSearch;
  });
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    
    // Check if today
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `Oggi, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Ieri, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show days ago
    const diffTime = Math.abs(today.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} giorni fa`;
  };
  
  return (
    <Card className="shadow-sm overflow-hidden mb-8">
      <CardHeader className="border-b border-neutral-100 px-6 py-6 flex justify-between items-center">
        <CardTitle className="text-lg font-poppins font-semibold text-primary">I tuoi ristoranti</CardTitle>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Cerca ristorante..."
              className="pl-9 pr-4 py-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute left-3 top-3 text-neutral-300 h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tutti i ristoranti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i ristoranti</SelectItem>
              <SelectItem value="active">Attivi</SelectItem>
              <SelectItem value="pending">In attesa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-neutral-100 bg-opacity-50">
              <TableRow>
                <TableHead className="px-6 py-3 text-left text-xs font-opensans font-semibold text-neutral-300 uppercase tracking-wider">
                  Ristorante
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-opensans font-semibold text-neutral-300 uppercase tracking-wider">
                  Sottodominio
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-opensans font-semibold text-neutral-300 uppercase tracking-wider">
                  Template
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-opensans font-semibold text-neutral-300 uppercase tracking-wider">
                  Stato
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-opensans font-semibold text-neutral-300 uppercase tracking-wider">
                  Ultima modifica
                </TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-opensans font-semibold text-neutral-300 uppercase tracking-wider">
                  Azioni
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white divide-y divide-neutral-100 dark:bg-gray-950 dark:divide-gray-800">
              {filteredRestaurants.map((restaurant) => (
                <TableRow key={restaurant.id} className="hover:bg-neutral-100 hover:bg-opacity-50 transition dark:hover:bg-gray-900">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 rounded-full">
                        <AvatarImage src={restaurant.logoUrl || ""} alt={restaurant.name} />
                        <AvatarFallback className="bg-primary text-white">
                          {restaurant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary dark:text-white">{restaurant.name}</div>
                        <div className="text-sm text-neutral-300">{restaurant.location || "-"}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <a href={`/view/${restaurant.subdomain}`} target="_blank" className="text-accent font-opensans text-sm hover:underline">
                      {restaurant.subdomain}.menumaster.com
                    </a>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                    {restaurant.templateId ? restaurant.templateId : "Default"}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="bg-success bg-opacity-10 text-success border-0">
                      Attivo
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                    {formatDate(restaurant.updatedAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-accent"
                      asChild
                    >
                      <Link href={`/restaurants/${restaurant.id}/menu`}>
                        <Menu size={16} />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-accent"
                      onClick={() => onEdit(restaurant)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-accent"
                      onClick={() => onGenerateQR(restaurant)}
                    >
                      <QrCode size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-accent"
                      asChild
                    >
                      <Link href={`/restaurants/${restaurant.id}/analytics`}>
                        <BarChart2 size={16} />
                      </Link>
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error hover:text-error/80"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminare il ristorante?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Questa azione non può essere annullata. Eliminerà definitivamente il ristorante
                            "{restaurant.name}" e tutti i suoi dati.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteRestaurant(restaurant.id)}
                            className="bg-error text-white hover:bg-error/90"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRestaurants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-300">
                    {isLoading 
                      ? "Caricamento ristoranti..." 
                      : "Nessun ristorante trovato"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-neutral-100 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-neutral-300 font-opensans">
            Mostrando <span className="font-semibold">{filteredRestaurants.length}</span> di <span className="font-semibold">{restaurants.length}</span> ristoranti
          </div>
          {/* Pagination would go here */}
        </div>
      </CardContent>
    </Card>
  );
};

export default RestaurantList;
