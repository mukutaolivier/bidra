import * as React from "react";

export type CardProps =
  React.HTMLAttributes<HTMLDivElement>;

export function Card({
  children,
  ...props
}: CardProps): React.ReactElement {
  return <div {...props}>{children}</div>;
}
