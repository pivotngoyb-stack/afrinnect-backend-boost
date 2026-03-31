import React, { Suspense, ComponentType } from 'react';
import LoadingSkeleton from './LoadingSkeleton';

interface LazyRouteProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export default function LazyRoute({ component: Component, fallback = <LoadingSkeleton />, ...props }: LazyRouteProps) {
  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}
