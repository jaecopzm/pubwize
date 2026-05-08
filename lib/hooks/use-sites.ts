import { useEffect, useState } from "react";

interface Site {
  id: string;
  siteName: string;
  domain: string;
  niche: string;
}

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesMap, setSitesMap] = useState<Record<string, Site>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch("/api/sites");

        if (res.ok) {
          const data = await res.json();
          const sitesData = data.sites.map((site: any) => ({
            id: site.id,
            siteName: site.siteName,
            domain: site.domain,
            niche: site.niche,
          }));
          
          setSites(sitesData);
          
          const map: Record<string, Site> = {};
          sitesData.forEach((site: Site) => {
            map[site.id] = site;
          });
          setSitesMap(map);
        }
      } catch (error) {
        console.error("Failed to fetch sites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  return { sites, sitesMap, loading };
}
