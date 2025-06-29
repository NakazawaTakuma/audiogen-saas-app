import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  className = "",
  as = "h2",
}) => {
  const Tag = as;
  return (
    <Tag
      className={`font-bold text-3xl md:text-4xl text-center text-primary drop-shadow mb-10 ${className}`.trim()}
    >
      {children}
    </Tag>
  );
};

export default SectionTitle;
