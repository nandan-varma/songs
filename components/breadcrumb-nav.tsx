'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, Music, Disc3, User, ListMusic, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbSegment {
  label: string;
  href: string;
  isCurrentPage: boolean;
  icon?: React.ReactNode;
}

const routeLabels: Record<string, string> = {
  'songs': 'Songs',
  'albums': 'Albums',
  'artists': 'Artists',
  'playlists': 'Playlists',
};

const routeIcons: Record<string, React.ReactNode> = {
  'songs': <Music className="h-3.5 w-3.5" />,
  'albums': <Disc3 className="h-3.5 w-3.5" />,
  'artists': <User className="h-3.5 w-3.5" />,
  'playlists': <ListMusic className="h-3.5 w-3.5" />,
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const router = useRouter();
  
  const breadcrumbs = useMemo<BreadcrumbSegment[]>(() => {
    if (pathname === '/') {
      return [];
    }

    const segments = pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbSegment[] = [];

    // Build breadcrumb segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;
      const isCategory = routeLabels[segment] !== undefined;

      // Format label - use predefined labels or capitalize
      let label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      let icon = routeIcons[segment];
      
      // If it's an ID (likely numeric or alphanumeric), show as "View"
      if (index > 0 && /^[0-9a-zA-Z_-]+$/.test(segment) && segment.length > 3 && !routeLabels[segment]) {
        label = 'View';
        icon = undefined;
      }

      crumbs.push({
        label,
        href: isCategory ? '#' : currentPath, // Categories are not clickable
        isCurrentPage: isLast || isCategory, // Treat categories as current page (non-clickable)
        icon,
      });
    });

    return crumbs;
  }, [pathname]);

  // Don't show breadcrumbs on home page
  if (pathname === '/' || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="flex-shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/" className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5" />
                    <span>Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.map((crumb: BreadcrumbSegment) => (
                <div key={crumb.href} className="flex items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {crumb.isCurrentPage ? (
                      <BreadcrumbPage className="flex items-center gap-1.5">
                        {crumb.icon}
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href} className="flex items-center gap-1.5">
                          {crumb.icon}
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
}

