import React from 'react';

interface SafeComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  componentName?: string;
}

export default function SafeComponent({ children, fallback = null, componentName = 'Component' }: SafeComponentProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => { setHasError(false); }, [children]);

  if (hasError) {
    return fallback || (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{componentName} failed to load</p>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error(`Error in ${componentName}:`, error);
    setHasError(true);
    return fallback;
  }
}
