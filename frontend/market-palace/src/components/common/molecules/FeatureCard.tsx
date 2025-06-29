import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/shadcn-ui/card";
import { Badge } from "@/components/shadcn-ui/badge";

interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  badgeText?: string;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badgeText,
  className = "",
}) => {
  return (
    <Card
      className={`text-center shadow-xl border-0 bg-white/80 backdrop-blur-md transition-transform duration-200 hover:scale-105 hover:shadow-2xl rounded-2xl ${className}`.trim()}
    >
      <CardHeader>
        <div className="flex flex-col items-center gap-2 mb-2">
          {icon}
          {badgeText && (
            <Badge variant="secondary" className="mb-1">
              {badgeText}
            </Badge>
          )}
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </div>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default FeatureCard;
