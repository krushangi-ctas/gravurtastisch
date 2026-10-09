import { useState, useEffect } from "react";
import { getWebsiteConfiguration, WebsiteConfiguration } from "@/lib/api";

let cachedConfig: WebsiteConfiguration | null = null;
let fetchPromise: Promise<WebsiteConfiguration | null> | null = null;

export async function fetchWebsiteConfig(): Promise<WebsiteConfiguration | null> {
  try {
    const res = await getWebsiteConfiguration();
    if (res?.data) {
      cachedConfig = res.data;
      return res.data;
    }
  } catch (err) {
    console.error("Error loading website configuration:", err);
  }
  return null;
}

export function useWebsiteConfiguration() {
  const [config, setConfig] = useState<WebsiteConfiguration | null>(cachedConfig);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    let isMounted = true;

    if (!fetchPromise) {
      fetchPromise = fetchWebsiteConfig().finally(() => {
        fetchPromise = null;
      });
    }

    fetchPromise.then((data) => {
      if (isMounted) {
        if (data) setConfig(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return { config, loading };
}

export default useWebsiteConfiguration;
