import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn-ui/card";

export interface FeatureProps {
  title: string;
  desc: string;
}

export const FeatureCard: React.FC<FeatureProps> = ({ title, desc }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{desc}</p>
    </CardContent>
  </Card>
);
