"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Photo {
  id: string;
  url: string;
  type: "BEFORE" | "AFTER" | "ISSUE";
  caption: string | null;
  createdAt: Date;
}

interface PhotoGalleryProps {
  photos: Photo[];
  emptyMessage?: string;
}

export function PhotoGallery({
  photos,
  emptyMessage = "No photos uploaded yet",
}: PhotoGalleryProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const typeColors = {
    BEFORE: "bg-blue-100 text-blue-800",
    AFTER: "bg-green-100 text-green-800",
    ISSUE: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <Card key={photo.id} className="overflow-hidden">
          <CardContent className="p-0 relative">
            <img
              src={photo.url}
              alt={photo.caption || `${photo.type} photo`}
              className="w-full h-32 object-cover"
            />
            <Badge
              variant="secondary"
              className={`absolute top-2 left-2 ${typeColors[photo.type]}`}
            >
              {photo.type}
            </Badge>
          </CardContent>
          {photo.caption && (
            <div className="p-2 text-xs text-muted-foreground">
              {photo.caption}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
