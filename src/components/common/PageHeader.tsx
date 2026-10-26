import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, action }) => {
  return (
    <div className="mb-6 pb-4 border-b border-charcoal-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1.5 text-xs text-beige mb-1.5">
            {breadcrumbs.map((b, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-beige-muted" />}
                {b.href ? (
                  <a href={b.href} className="hover:text-gold transition-colors">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-warmwhite/80 font-medium">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-warmwhite tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-beige mt-1">{subtitle}</p>}
      </div>

      {action && <div className="flex items-center space-x-2.5 flex-wrap">{action}</div>}
    </div>
  );
};
