import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ui/theme-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MoonIcon, SunIcon } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, {
    message: "Il nome deve essere di almeno 2 caratteri.",
  }),
  email: z.string().email({
    message: "Inserisci un indirizzo email valido.",
  }),
});

const notificationsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  activityEmails: z.boolean().default(true),
});

const Settings = () => {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.firstName || "",
      email: user?.email || "",
    },
  });
  
  const notificationsForm = useForm<z.infer<typeof notificationsSchema>>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
      activityEmails: true,
    },
  });
  
  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    toast({
      title: "Profilo aggiornato",
      description: "Le tue impostazioni del profilo sono state salvate.",
    });
  };
  
  const onNotificationsSubmit = (data: z.infer<typeof notificationsSchema>) => {
    toast({
      title: "Notifiche aggiornate",
      description: "Le tue preferenze di notifica sono state salvate.",
    });
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
      
      <div className="flex-1 pl-64 overflow-y-auto">
        <Topbar 
          title="Impostazioni" 
          showNewButton={false}
        />
        
        <div className="p-6">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifiche</TabsTrigger>
              <TabsTrigger value="appearance">Aspetto</TabsTrigger>
            </TabsList>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Profilo</CardTitle>
                  <CardDescription>
                    Gestisci le informazioni del tuo profilo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Il tuo nome" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="La tua email" 
                                  type="email"
                                  readOnly
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                L'email non può essere modificata.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button type="submit">Salva Modifiche</Button>
                    </form>
                  </Form>
                </CardContent>
                <Separator />
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Impostazioni generali del tuo account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Lingua</h4>
                    <Select defaultValue="it">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona lingua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Fuso orario</h4>
                    <Select defaultValue="europe-rome">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona fuso orario" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="europe-rome">Europe/Rome (GMT+1)</SelectItem>
                        <SelectItem value="europe-london">Europe/London (GMT+0)</SelectItem>
                        <SelectItem value="america-new_york">America/New York (GMT-5)</SelectItem>
                        <SelectItem value="asia-tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                        <SelectItem value="australia-sydney">Australia/Sydney (GMT+11)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex flex-col items-start">
                  <h4 className="font-medium text-destructive">Zona di pericolo</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Queste azioni sono irreversibili. Procedi con cautela.
                  </p>
                  <Button variant="destructive">Elimina account</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Notifications Settings */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notifiche</CardTitle>
                  <CardDescription>
                    Configura come e quando ricevere le notifiche
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...notificationsForm}>
                    <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={notificationsForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Notifiche via Email
                                </FormLabel>
                                <FormDescription>
                                  Ricevi notifiche via email per aggiornamenti importanti
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="pushNotifications"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Notifiche Push
                                </FormLabel>
                                <FormDescription>
                                  Ricevi notifiche push sul tuo browser o dispositivo
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="marketingEmails"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Email di Marketing
                                </FormLabel>
                                <FormDescription>
                                  Ricevi email su nuove funzionalità e promozioni
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={notificationsForm.control}
                          name="activityEmails"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Email di Attività
                                </FormLabel>
                                <FormDescription>
                                  Ricevi aggiornamenti sulle attività dei tuoi ristoranti
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Button type="submit">Salva Preferenze</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Appearance Settings */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Aspetto</CardTitle>
                  <CardDescription>
                    Personalizza l'aspetto dell'interfaccia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Tema</h4>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="w-24"
                      >
                        <SunIcon className="h-4 w-4 mr-2" /> Chiaro
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="w-24"
                      >
                        <MoonIcon className="h-4 w-4 mr-2" /> Scuro
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="w-24"
                      >
                        Sistema
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Seleziona il tema che preferisci per l'interfaccia dell'applicazione.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Layout</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-4 cursor-pointer bg-accent/10">
                        <div className="flex items-center justify-between mb-2">
                          <span>Barra laterale</span>
                          <Checkbox checked disabled />
                        </div>
                        <div className="w-full h-24 border rounded flex">
                          <div className="w-1/4 h-full bg-primary/20"></div>
                          <div className="w-3/4 h-full bg-muted"></div>
                        </div>
                      </div>
                      <div className="border rounded-md p-4 cursor-pointer opacity-60">
                        <div className="flex items-center justify-between mb-2">
                          <span>Barra superiore</span>
                          <Checkbox disabled />
                        </div>
                        <div className="w-full h-24 border rounded flex flex-col">
                          <div className="w-full h-1/4 bg-primary/20"></div>
                          <div className="w-full h-3/4 bg-muted"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Scegli il layout di navigazione che preferisci.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Densità</h4>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-24"
                      >
                        Compatta
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-24"
                      >
                        Normale
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-24"
                      >
                        Comoda
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Regola la densità delle informazioni visualizzate.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => {
                    toast({
                      title: "Impostazioni salvate",
                      description: "Le tue preferenze di aspetto sono state aggiornate.",
                    });
                  }}>
                    Salva Preferenze
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
