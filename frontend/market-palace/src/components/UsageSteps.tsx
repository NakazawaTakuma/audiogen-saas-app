import React from "react";
import { Steps, Step } from "@/components/shadcn-ui/steps";

export const UsageSteps: React.FC<{ steps: string[] }> = ({ steps }) => (
  <Steps currentStep={-1} className="max-w-md mx-auto">
    {steps.map((label, i) => (
      <Step key={i} title={label} />
    ))}
  </Steps>
);
