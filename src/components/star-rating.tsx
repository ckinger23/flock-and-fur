interface StarRatingProps {
  rating: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  rating,
  showValue = true,
  size = "md",
}: StarRatingProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`flex ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}
          >
            ★
          </span>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
}
