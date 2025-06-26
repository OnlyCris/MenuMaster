import { Utensils, Eye, QrCode, Menu, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBgColor: string;
  iconColor: string;
};

const StatCard = ({ icon, label, value, iconBgColor, iconColor }: StatCardProps) => {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 md:p-6 flex items-center">
        <div className={`rounded-full ${iconBgColor} p-2 md:p-3 mr-2 md:mr-4 flex-shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-neutral-500 dark:text-gray-400 text-xs md:text-sm font-medium truncate">{label}</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

type StatCardsProps = {
  restaurantsCount: number;
  visitsToday: number;
  scansToday: number;
  totalMenuItems?: number;
  totalCategories?: number;
};

const StatCards = ({ restaurantsCount, visitsToday, scansToday, totalMenuItems = 0, totalCategories = 0 }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
      <StatCard
        icon={<Utensils className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />}
        label="Ristoranti"
        value={restaurantsCount}
        iconBgColor="bg-blue-100 dark:bg-blue-900"
        iconColor="text-blue-600"
      />
      <StatCard
        icon={<Eye className="w-4 h-4 md:w-6 md:h-6 text-green-600" />}
        label="Visite Totali"
        value={visitsToday}
        iconBgColor="bg-green-100 dark:bg-green-900"
        iconColor="text-green-600"
      />
      <StatCard
        icon={<QrCode className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />}
        label="Scansioni QR"
        value={scansToday}
        iconBgColor="bg-purple-100 dark:bg-purple-900"
        iconColor="text-purple-600"
      />
      <StatCard
        icon={<Menu className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />}
        label="Piatti Totali"
        value={totalMenuItems}
        iconBgColor="bg-orange-100 dark:bg-orange-900"
        iconColor="text-orange-600"
      />
      <StatCard
        icon={<FolderOpen className="w-4 h-4 md:w-6 md:h-6 text-red-600" />}
        label="Categorie"
        value={totalCategories}
        iconBgColor="bg-red-100 dark:bg-red-900"
        iconColor="text-red-600"
      />
    </div>
  );
};

export default StatCards;
