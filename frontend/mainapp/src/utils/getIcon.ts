// src/utils/icons.ts
import type { FC, SVGProps } from "react";

const modules = import.meta.glob<FC<SVGProps<SVGSVGElement>>>(
  "../assets/common/icon/*.svg",
  {
    eager: true,
    query: "?react",
    import: "default",
  }
) as Record<string, FC<SVGProps<SVGSVGElement>>>;

export const icons = Object.fromEntries(
  Object.entries(modules).map(([path, Component]) => {
    const match = path.match(/\/([^\/]+)\.svg$/);
    const name = match?.[1] ?? path;
    return [name, Component];
  })
) as Record<string, FC<SVGProps<SVGSVGElement>>>;

export type IconName = keyof typeof icons;

export function getIconComponent(name: IconName): FC<SVGProps<SVGSVGElement>> {
  const Component = icons[name];
  if (!Component) {
    throw new Error(`Icon not found: ${name}`);
  }
  return Component;
}
