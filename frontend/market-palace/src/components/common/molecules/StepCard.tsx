import React from "react";
import { Card } from "@/components/shadcn-ui/card";
import { Badge } from "@/components/shadcn-ui/badge";

interface StepCardProps {
  stepNumber: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  description,
  icon,
  className = "",
}) => {
  return (
    <Card
      className={`flex items-center gap-4 bg-white/70 backdrop-blur-md rounded-xl shadow p-4 ${className}`.trim()}
    >
      <Badge
        variant="default"
        className="text-base h-8 w-16 flex items-center justify-center rounded-lg mr-2"
      >
        STEP {stepNumber}
      </Badge>
      <div className="flex-1">
        <div className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title}
        </div>
        {description && (
          <div className="text-muted-foreground text-sm mt-1">
            {description}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StepCard;
