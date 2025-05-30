import { useQuery } from "@tanstack/react-query";

interface PaymentStatus {
  hasPaid: boolean;
  paymentDate?: string;
  isAdmin: boolean;
}

export function usePayment() {
  const { data, isLoading, error } = useQuery<PaymentStatus>({
    queryKey: ["/api/payment-status"],
    retry: false,
  });

  return {
    hasPaid: data?.hasPaid || false,
    paymentDate: data?.paymentDate,
    isAdmin: data?.isAdmin || false,
    isLoading,
    error,
    requiresPayment: !data?.hasPaid && !data?.isAdmin,
  };
}