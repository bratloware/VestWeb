import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import './PageHeader.css';

interface PageHeaderProps {
  crumb: string;
  title: ReactNode;
  subtitle?: string;
  right?: ReactNode;
}

const PageHeader = ({ crumb, title, subtitle, right }: PageHeaderProps) => (
  <header className="vw-page-header">
    <nav className="vw-page-breadcrumb" aria-label="Breadcrumb">
      <span>Inicio</span>
      <ChevronRight size={12} />
      <span className="vw-page-breadcrumb-current">{crumb}</span>
    </nav>

    <div className="vw-page-header-top">
      <h1 className="vw-page-header-title">{title}</h1>
      {right ? <div className="vw-page-header-right">{right}</div> : null}
    </div>

    {subtitle ? <p className="vw-page-header-subtitle">{subtitle}</p> : null}
  </header>
);

export const HeaderAccent = ({ children }: { children: ReactNode }) => (
  <span className="vw-page-header-accent">{children}</span>
);

export default PageHeader;
