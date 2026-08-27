"use client";

import * as React from "react";
import { API_ROUTES } from "@/config/api-routes";
import type { DeliveryRate } from "@/types/courier";

interface UseDeliveryChargeReturn {
  rate: DeliveryRate | null;
  isLoading: boolean;
  error: string | null;
  calculateCharge: (district: string, weightKg: number, codAmount?: number) => Promise<DeliveryRate | null>;
  reset: () => void;
}

export function useDeliveryCharge(): UseDeliveryChargeReturn {
  const [rate, setRate] = React.useState<DeliveryRate | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const calculateCharge = React.useCallback(
    async (district: string, weightKg: number, codAmount?: number): Promise<DeliveryRate | null> => {
      if (!district || weightKg <= 0) {
        setRate(null);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.COURIER_CALCULATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            district,
            weightKg,
            codAmount,
            deliveryType: "normal",
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          const errorMsg = result.message || "Failed to calculate delivery charge";
          setError(errorMsg);
          setRate(null);
          return null;
        }

        const deliveryRate = result.data as DeliveryRate;
        setRate(deliveryRate);
        return deliveryRate;
      } catch (err) {
        const errorMsg = "Unable to calculate delivery charge. Please try again.";
        setError(errorMsg);
        setRate(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = React.useCallback(() => {
    setRate(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { rate, isLoading, error, calculateCharge, reset };
}
