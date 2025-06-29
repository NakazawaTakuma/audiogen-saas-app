/* src/components/Icon.tsx */
import { FC, SVGProps } from "react";
import { getIconComponent, IconName } from "@/utils/getIcon";
import styles from "./Icon.module.css";

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  className?: string;
}

export const Icon: FC<IconProps> = ({
  name,
  size = 24,
  className = "",
  ...props
}) => {
  const Component = getIconComponent(name);
  return (
    <Component
      style={{ width: size, height: size }}
      className={`${styles.icon} ${className}`.trim()}
      {...props}
    />
  );
};
