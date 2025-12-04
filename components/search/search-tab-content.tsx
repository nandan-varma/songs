'use client';

import { memo, ReactNode } from 'react';
import { LoadingSpinner, EmptyState } from './search-states';

interface SearchTabContentProps {
  type: string;
  isLoading: boolean;
  hasResults: boolean;
  query: string;
  children?: ReactNode;
}

export const SearchTabContent = memo(function SearchTabContent({
  type,
  isLoading,
  hasResults,
  query,
  children,
}: SearchTabContentProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!hasResults) {
    return <EmptyState query={query} message={`No ${type} found for "${query}"`} />;
  }
  
  return <>{children}</>;
});