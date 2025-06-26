import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, 
  Utensils, 
  ClipboardList, 
  CircleAlert, 
  Settings,
  Users,
  HelpCircle,
  LogOut,
  Shield,
  CreditCard,
  Menu,
  X,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const SidebarLink = ({ href, icon, label, active, onClick }: SidebarLinkProps) => {
  return (
    <li>
      <Link href={href}>
        <div 
          className={cn(
            "flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-white hover:bg-accent px-4 py-2 rounded-lg mx-2",
            active && "bg-accent bg-opacity-30"
          )}
          onClick={onClick}
        >
          {icon}
          <span className="font-opensans ml-3">{label}</span>
        </div>
      </Link>
    </li>
  );
};

const Sidebar = () => {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Close mobile menu when screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) return null;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-white shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "sidebar bg-primary flex flex-col fixed z-50 transition-transform duration-300 ease-in-out",
        "w-64 h-screen",
        "md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-center h-20 shadow-md">
          <h1 className="text-white font-poppins font-bold text-xl md:text-2xl">MenuIsland</h1>
        </div>
        
        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-2">
            <SidebarLink
              href="/"
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              active={location === "/"}
              onClick={closeMobileMenu}
            />
            
            <SidebarLink
              href="/restaurants"
              icon={<Utensils size={20} />}
              label="I Miei Ristoranti"
              active={location === "/restaurants"}
              onClick={closeMobileMenu}
            />
            
            <SidebarLink
              href="/templates"
              icon={<ClipboardList size={20} />}
              label="Template"
              active={location === "/templates"}
              onClick={closeMobileMenu}
            />
            
            <SidebarLink
              href="/allergens"
              icon={<CircleAlert size={20} />}
              label="Allergeni"
              active={location === "/allergens"}
              onClick={closeMobileMenu}
            />

            {user?.isAdmin && (
              <SidebarLink
                href="/admin"
                icon={<Shield size={20} />}
                label="Admin Panel"
                active={location === "/admin"}
                onClick={closeMobileMenu}
              />
            )}

            {user?.isAdmin && (
              <SidebarLink
                href="/admin/support"
                icon={<MessageCircle size={20} />}
                label="Gestione Supporto"
                active={location === "/admin/support"}
                onClick={closeMobileMenu}
              />
            )}

            {user?.isAdmin && (
              <SidebarLink
                href="/clients"
                icon={<Users size={20} />}
                label="Inviti Clienti"
                active={location === "/clients"}
                onClick={closeMobileMenu}
              />
            )}

            {!user?.hasPaid && (
              <SidebarLink
                href="/payment"
                icon={<CreditCard size={20} />}
                label="Attiva Servizio"
                active={location === "/payment"}
                onClick={closeMobileMenu}
              />
            )}
            
            <SidebarLink
              href="/settings"
              icon={<Settings size={20} />}
              label="Impostazioni"
              active={location === "/settings"}
              onClick={closeMobileMenu}
            />
          </ul>
        </div>
        
        <div className="p-4 border-t border-gray-600">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-gray-300 text-xs truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <div className="space-y-1">
            <SidebarLink
              href="/help"
              icon={<HelpCircle size={20} />}
              label="Aiuto"
              active={location === "/help"}
              onClick={closeMobileMenu}
            />
            
            <SidebarLink
              href="/api/logout"
              icon={<LogOut size={20} />}
              label="Esci"
              onClick={closeMobileMenu}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;