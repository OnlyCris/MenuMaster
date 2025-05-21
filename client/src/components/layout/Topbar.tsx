import { useState } from "react";
import { 
  PlusCircle, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type TopbarProps = {
  title: string;
  onNewRestaurantClick?: () => void;
  showNewButton?: boolean;
};

const Topbar = ({ title, onNewRestaurantClick, showNewButton = true }: TopbarProps) => {
  const { user } = useAuth();
  
  return (
    <div className="sticky top-0 bg-white shadow-md p-4 flex justify-between items-center z-10 dark:bg-gray-900">
      <div>
        <h2 className="text-xl font-poppins font-semibold text-primary dark:text-white">{title}</h2>
      </div>
      <div className="flex items-center space-x-4">
        {showNewButton && (
          <Button 
            className="bg-accent hover:bg-opacity-80 text-white font-opensans flex items-center gap-2"
            onClick={onNewRestaurantClick}
          >
            <PlusCircle size={18} />
            Nuovo Ristorante
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 focus:ring-0 hover:bg-transparent p-0">
              <Avatar className="w-10 h-10">
                <AvatarImage 
                  src={user?.profileImageUrl || ""} 
                  alt={user?.firstName || "User"} 
                />
                <AvatarFallback className="bg-neutral-200">
                  {(user?.firstName?.[0] || "U")}
                </AvatarFallback>
              </Avatar>
              <span className="font-opensans text-primary dark:text-white">
                {user?.firstName || "Admin"}
              </span>
              <ChevronDown size={16} className="text-neutral-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              <User size={16} className="mr-2" />
              Profilo
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings size={16} className="mr-2" />
              Impostazioni
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-error cursor-pointer" asChild>
              <a href="/api/logout">
                <LogOut size={16} className="mr-2" />
                Esci
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Topbar;
