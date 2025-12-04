'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Image as ImageType, EntityType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProgressiveImageProps {
  images: ImageType[];
  alt: string;
  entityType?: EntityType | string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  rounded?: 'none' | 'default' | 'full';
}

const FALLBACK_URL = 'https://placehold.co/500x500?text=Image+Not+Found';

export function ProgressiveImage({
  images,
  alt,
  entityType,
  priority = false,
  className,
  fill = true,
  width,
  height,
  rounded = 'default',
}: ProgressiveImageProps) {
  const [currentQualityIndex, setCurrentQualityIndex] = useState(0);
  const [imageSrc, setImageSrc] = useState<string>(() => {
    // Start with lowest quality image
    return images?.[0]?.url || FALLBACK_URL;
  });
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!images || images.length === 0) {
      setImageSrc(FALLBACK_URL);
      setHasError(true);
      setIsHighQualityLoaded(true);
      return;
    }

    // Reset error state
    setHasError(false);
    setIsHighQualityLoaded(false);
    setCurrentQualityIndex(0);

    // Test low quality image first
    const lowQualityUrl = images[0]?.url;
    if (!lowQualityUrl) {
      setImageSrc(FALLBACK_URL);
      setHasError(true);
      setIsHighQualityLoaded(true);
      return;
    }

    // Preload low quality to check if it works
    const lowImg = new window.Image();
    lowImg.src = lowQualityUrl;
    
    lowImg.onload = () => {
      // Low quality loaded successfully, use it
      setImageSrc(lowQualityUrl);

      // Now try to load high quality image
      const highQualityIndex = images.length - 1;
      if (highQualityIndex > 0 && images[highQualityIndex]?.url) {
        const highImg = new window.Image();
        highImg.src = images[highQualityIndex].url;
        highImg.onload = () => {
          setImageSrc(images[highQualityIndex].url);
          setCurrentQualityIndex(highQualityIndex);
          setIsHighQualityLoaded(true);
        };
        highImg.onerror = () => {
          // High quality failed, but low quality is working
          console.warn('Failed to load high quality image, staying with low quality');
          setIsHighQualityLoaded(true);
        };
      } else {
        setIsHighQualityLoaded(true);
      }
    };

    lowImg.onerror = () => {
      // Low quality failed, use fallback immediately
      console.warn('Failed to load image, using fallback');
      setImageSrc(FALLBACK_URL);
      setHasError(true);
      setIsHighQualityLoaded(true);
    };
  }, [images]);

  const handleError = () => {
    // Fallback in case Next.js Image onError is triggered
    if (!hasError && imageSrc !== FALLBACK_URL) {
      console.warn('Image error detected, switching to fallback');
      setHasError(true);
      setImageSrc(FALLBACK_URL);
      setIsHighQualityLoaded(true);
    }
  };

  const roundedClasses = {
    none: '',
    default: 'rounded',
    full: 'rounded-full',
  };

  const imageClassName = cn(
    'object-cover transition-opacity duration-300',
    !isHighQualityLoaded && 'blur-sm',
    isHighQualityLoaded && 'blur-0',
    className
  );

  const wrapperClassName = cn(
    'overflow-hidden bg-muted',
    roundedClasses[rounded]
  );

  const imageAlt = hasError ? 'Image not found' : (alt || 'Image');

  // Use regular img tag for fallback to avoid Next.js Image optimization issues
  if (hasError) {
    return (
      <div className={wrapperClassName}>
        <img
          src={FALLBACK_URL}
          alt={imageAlt}
          className={cn(imageClassName, fill ? 'absolute inset-0 w-full h-full' : '')}
          style={fill ? { position: 'absolute', height: '100%', width: '100%', inset: 0 } : undefined}
        />
      </div>
    );
  }

  if (fill) {
    return (
      <div className={wrapperClassName}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className={imageClassName}
          onError={handleError}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={width || 500}
        height={height || 500}
        className={imageClassName}
        onError={handleError}
        priority={priority}
      />
    </div>
  );
}
