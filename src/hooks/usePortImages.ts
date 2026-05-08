import { useState, useEffect } from "react";

type PortImages = Record<string, string>;

export function usePortImages(refreshTrigger?: number): PortImages {
  const [images, setImages] = useState<PortImages>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("customGoodImages");
      setImages(stored ? (JSON.parse(stored) as PortImages) : {});
    } catch {
      setImages({});
    }
  }, [refreshTrigger]);

  return images;
}

/**
 * savePortImage
 * 
 * Бараагийн зургийг localStorage-д хадгалах helper.
 */
export function savePortImage(goodId: string, imageUrl: string): void {
  try {
    const stored = localStorage.getItem("customGoodImages");
    const current: PortImages = stored
      ? (JSON.parse(stored) as PortImages)
      : {};
    current[goodId] = imageUrl;
    localStorage.setItem("customGoodImages", JSON.stringify(current));
  } catch {
    console.error("usePortImages: localStorage-д бичих алдаа");
  }
}

/**
 * removePortImage
 * 
 * Барааны зургийг localStorage-с устгах helper.
 */
export function removePortImage(goodId: string): void {
  try {
    const stored = localStorage.getItem("customGoodImages");
    if (!stored) return;
    const current: PortImages = JSON.parse(stored) as PortImages;
    delete current[goodId];
    localStorage.setItem("customGoodImages", JSON.stringify(current));
  } catch {
    console.error("usePortImages: localStorage-с устгах алдаа");
  }
}
