import { Utensils, Eye, QrCode } from "lucide-react";
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
    <Card className="shadow-sm">
      <CardContent className="p-6 flex items-center">
        <div className={`rounded-full ${iconBgColor} p-3 mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-neutral-300 text-sm font-opensans">{label}</p>
          <p className="text-2xl font-poppins font-semibold text-primary dark:text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

type StatCardsProps = {
  restaurantsCount: number;
  visitsToday: number;
  scansToday: number;
};

const StatCards = ({ restaurantsCount, visitsToday, scansToday }: StatCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StatCard
        icon={<Utensils className="text-xl text-primary" />}
        label="Ristoranti Totali"
        value={restaurantsCount}
        iconBgColor="bg-primary bg-opacity-10"
        iconColor="text-primary"
      />
      <StatCard
        icon={<Eye className="text-xl text-success" />}
        label="Visite Ai Menù (Oggi)"
        value={visitsToday}
        iconBgColor="bg-success bg-opacity-10"
        iconColor="text-success"
      />
      <StatCard
        icon={<QrCode className="text-xl text-accent" />}
        label="Scansioni QR (Oggi)"
        value={scansToday}
        iconBgColor="bg-accent bg-opacity-10"
        iconColor="text-accent"
      />
    </div>
  );
};

export default StatCards;
