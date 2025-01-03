import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface AlertProps {
  children: ReactNode;
  className?: string;
}

interface AlertTitleProps {
  children: ReactNode;
  className?: string;
}

interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

const Alert = ({ children, className }: AlertProps) => {
  return (
    <div className={cn("rounded-md border border-border bg-background p-4 relative", className)}>
      {children}
    </div>
  );
};

const AlertTitle = ({ children, className }: AlertTitleProps) => {
  return (
    <div className={cn("text-lg font-semibold", className)}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children, className }: AlertDescriptionProps) => {
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
};

export { Alert, AlertTitle, AlertDescription };
