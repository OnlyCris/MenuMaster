import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import AllergenManager from "@/components/allergens/AllergenManager";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Allergens = () => {
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

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
      
      <div className="flex-1 pl-64 overflow-y-auto">
        <Topbar 
          title="Gestione Allergeni" 
          showNewButton={false}
        />
        
        <div className="p-6 space-y-6">
          <AllergenManager />
          
          <Card>
            <CardHeader>
              <CardTitle>Informazioni sugli Allergeni</CardTitle>
              <CardDescription>
                Linee guida per la gestione degli allergeni nei menu
              </CardDescription>
            </CardHeader>
            <CardContent className="prose max-w-none dark:prose-invert">
              <h3>Importanza degli Allergeni</h3>
              <p>
                Fornire informazioni accurate sugli allergeni è fondamentale per garantire la sicurezza dei clienti.
                Molti paesi hanno normative che richiedono ai ristoranti di dichiarare la presenza di allergeni comuni nei piatti.
              </p>
              
              <h3>Allergeni Comuni</h3>
              <p>
                Gli allergeni più comuni che dovrebbero essere sempre indicati:
              </p>
              <ul>
                <li><strong>Glutine</strong>: Presente in grano, orzo, segale</li>
                <li><strong>Crostacei</strong>: Gamberi, granchi, aragoste</li>
                <li><strong>Uova</strong></li>
                <li><strong>Pesce</strong></li>
                <li><strong>Arachidi</strong></li>
                <li><strong>Soia</strong></li>
                <li><strong>Latte</strong>: Inclusi latticini</li>
                <li><strong>Frutta a guscio</strong>: Mandorle, nocciole, noci</li>
                <li><strong>Sedano</strong></li>
                <li><strong>Senape</strong></li>
                <li><strong>Semi di sesamo</strong></li>
                <li><strong>Anidride solforosa e solfiti</strong></li>
                <li><strong>Lupini</strong></li>
                <li><strong>Molluschi</strong></li>
              </ul>
              
              <h3>Best Practices</h3>
              <ol>
                <li>Utilizza icone chiare e facilmente riconoscibili per ogni allergene</li>
                <li>Assicurati che le informazioni sugli allergeni siano accurate e aggiornate</li>
                <li>Permetti ai clienti di filtrare i piatti in base alle loro restrizioni alimentari</li>
                <li>Includi informazioni dettagliate sugli ingredienti di ogni piatto</li>
              </ol>
              
              <p>
                Ricorda: La trasparenza riguardo agli allergeni non solo è un obbligo legale in molti paesi,
                ma è anche un ottimo servizio per i clienti con restrizioni alimentari.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Allergens;
