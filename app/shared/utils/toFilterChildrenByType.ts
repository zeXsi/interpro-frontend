import React, { ReactNode, ReactElement, ComponentType } from "react";

export default function toFilterChildrenByType<T extends ComponentType<any>>(
  children: ReactNode,
  types: T[]
): ReactElement[][] {
  if (!children) return types.map(() => []);
  const childrenArray = React.Children.toArray(children);
  return types.map((type) =>
    childrenArray.filter(
      (child): child is ReactElement =>
        React.isValidElement(child) && child.type === type
    )
  );
}
