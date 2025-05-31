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
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
};

const SidebarLink = ({ href, icon, label, active }: SidebarLinkProps) => {
  return (
    <li>
      <Link href={href} className={cn(
        "flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-white hover:bg-accent px-4 py-2 rounded-lg mx-2",
        active && "bg-accent bg-opacity-30"
      )}>
        {icon}
        <span className="font-opensans ml-3">{label}</span>
      </Link>
    </li>
  );
};

const Sidebar = () => {
  const [location] = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="sidebar bg-primary w-64 h-screen flex flex-col fixed">
      <div className="flex items-center justify-center h-20 shadow-md">
        <h1 className="text-white font-poppins font-bold text-2xl">MenuMaster</h1>
      </div>
      
      <ul className="flex flex-col py-4">
        <SidebarLink 
          href="/" 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          active={location === "/"} 
        />
        <SidebarLink 
          href="/restaurants" 
          icon={<Utensils size={20} />} 
          label="Ristoranti" 
          active={location.startsWith("/restaurants")} 
        />
        <SidebarLink 
          href="/templates" 
          icon={<ClipboardList size={20} />} 
          label="Templates" 
          active={location.startsWith("/templates")} 
        />
        <SidebarLink 
          href="/allergens" 
          icon={<CircleAlert size={20} />} 
          label="Allergeni" 
          active={location.startsWith("/allergens")} 
        />
        <SidebarLink 
          href="/clients" 
          icon={<Users size={20} />} 
          label="Clienti" 
          active={location.startsWith("/clients")} 
        />
        
        {/* Payment link for users who haven't paid */}
        {user && !user.hasPaid && (
          <SidebarLink 
            href="/payment" 
            icon={<CreditCard size={20} />} 
            label="Attiva Servizio" 
            active={location.startsWith("/payment")} 
          />
        )}
        
        {/* Admin panel for admin users */}
        {user?.isAdmin && (
          <SidebarLink 
            href="/admin" 
            icon={<Shield size={20} />} 
            label="Pannello Admin" 
            active={location.startsWith("/admin")} 
          />
        )}
        
        <SidebarLink 
          href="/settings" 
          icon={<Settings size={20} />} 
          label="Impostazioni" 
          active={location.startsWith("/settings")} 
        />
        
        <li className="mt-auto mb-4">
          <Link href="/help">
            <a className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-white hover:bg-accent px-4 py-2 rounded-lg mx-2">
              <HelpCircle size={20} />
              <span className="font-opensans ml-3">Supporto</span>
            </a>
          </Link>
        </li>
        
        <li className="mb-4">
          <a 
            href="/api/logout"
            className="flex flex-row items-center h-12 transform hover:translate-x-2 transition-transform ease-in duration-200 text-white hover:bg-accent px-4 py-2 rounded-lg mx-2"
          >
            <LogOut size={20} />
            <span className="font-opensans ml-3">Esci</span>
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
