import { useState } from "react";
import { useLocation } from "wouter";
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
      <div className="flex-1 md:ml-0 ml-12">
        <h2 className="text-lg md:text-xl font-poppins font-semibold text-primary dark:text-white truncate">{title}</h2>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        {showNewButton && (
          <Button 
            className="bg-accent hover:bg-opacity-80 text-white font-opensans flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 text-sm md:text-base"
            onClick={onNewRestaurantClick}
          >
            <PlusCircle size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Nuovo Ristorante</span>
            <span className="sm:hidden">Nuovo</span>
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-1 md:space-x-2 focus:ring-0 hover:bg-transparent p-0">
              <Avatar className="w-8 h-8 md:w-10 md:h-10">
                <AvatarImage 
                  src={user?.profileImageUrl || ""} 
                  alt={user?.firstName || "User"} 
                />
                <AvatarFallback className="bg-neutral-200 text-xs md:text-sm">
                  {(user?.firstName?.[0] || "U")}
                </AvatarFallback>
              </Avatar>
              <span className="font-opensans text-primary dark:text-white text-sm md:text-base hidden sm:inline">
                {user?.firstName || "Admin"}
              </span>
              <ChevronDown size={14} className="text-neutral-300 md:w-4 md:h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = '/settings'}>
              <User size={16} className="mr-2" />
              Profilo
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = '/settings'}>
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
