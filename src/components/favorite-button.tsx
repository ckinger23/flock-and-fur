"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addFavoriteCleaner, removeFavoriteCleaner } from "@/lib/actions/favorites";
import { toast } from "sonner";

interface FavoriteButtonProps {
  cleanerId: string;
  cleanerName: string;
  isFavorite: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function FavoriteButton({
  cleanerId,
  cleanerName,
  isFavorite: initialFavorite,
  variant = "outline",
  size = "sm",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);

    if (isFavorite) {
      const result = await removeFavoriteCleaner(cleanerId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsFavorite(false);
        toast.success(`${cleanerName} removed from favorites`);
      }
    } else {
      const result = await addFavoriteCleaner(cleanerId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsFavorite(true);
        toast.success(`${cleanerName} added to favorites!`);
      }
    }

    setIsLoading(false);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={isFavorite ? "text-red-500 hover:text-red-600" : ""}
    >
      <span className="mr-1">{isFavorite ? "♥" : "♡"}</span>
      {isFavorite ? "Favorited" : "Add to Favorites"}
    </Button>
  );
}
