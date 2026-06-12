"use client";

import { useEffect, useState } from "react";
import { normalizeLocationNodes } from "@/lib/location-nodes";
import { isLocationAllValue } from "@/lib/location-params";
import type { LocationNode } from "@/types/location";

interface UseLocationTreeOptions {
  cityId: string;
  districtId: string;
}

export function useLocationTree({ cityId, districtId }: UseLocationTreeOptions) {
  const [cities, setCities] = useState<LocationNode[]>([]);
  const [districts, setDistricts] = useState<LocationNode[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<LocationNode[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      setLoadingCities(true);
      setError(null);

      try {
        const response = await fetch("/api/location/tree", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("İl listesi yüklenemedi.");
        }

        const payload = (await response.json()) as {
          items: Array<{
            id: string | number;
            name: string;
            latitude?: number | null;
            longitude?: number | null;
          }>;
        };
        setCities(normalizeLocationNodes(payload.items ?? []));
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setCities([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Konum verileri yüklenemedi."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCities(false);
        }
      }
    }

    loadCities();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (isLocationAllValue(cityId)) {
      setDistricts([]);
      return;
    }

    const controller = new AbortController();

    async function loadDistricts() {
      setLoadingDistricts(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/location/tree?city_id=${encodeURIComponent(cityId)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("İlçe listesi yüklenemedi.");
        }

        const payload = (await response.json()) as {
          items: Array<{
            id: string | number;
            name: string;
            latitude?: number | null;
            longitude?: number | null;
          }>;
        };
        setDistricts(normalizeLocationNodes(payload.items ?? []));
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setDistricts([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "İlçe verileri yüklenemedi."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDistricts(false);
        }
      }
    }

    loadDistricts();

    return () => controller.abort();
  }, [cityId]);

  useEffect(() => {
    if (isLocationAllValue(districtId)) {
      setNeighborhoods([]);
      return;
    }

    const controller = new AbortController();

    async function loadNeighborhoods() {
      setLoadingNeighborhoods(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/location/tree?district_id=${encodeURIComponent(districtId)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Mahalle listesi yüklenemedi.");
        }

        const payload = (await response.json()) as {
          items: Array<{
            id: string | number;
            name: string;
            latitude?: number | null;
            longitude?: number | null;
          }>;
        };
        setNeighborhoods(normalizeLocationNodes(payload.items ?? []));
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setNeighborhoods([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Mahalle verileri yüklenemedi."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoadingNeighborhoods(false);
        }
      }
    }

    loadNeighborhoods();

    return () => controller.abort();
  }, [districtId]);

  return {
    cities,
    districts,
    neighborhoods,
    loadingCities,
    loadingDistricts,
    loadingNeighborhoods,
    error,
  };
}
