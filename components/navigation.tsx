'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music2, Search, Home } from 'lucide-react';
import { Button } from './ui/button';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <Music2 className="h-6 w-6" />
              <span>Music App</span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
