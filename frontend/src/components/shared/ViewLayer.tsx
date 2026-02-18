import { useState, ReactNode } from 'react';
import './ViewLayer.css';

interface ViewLayerProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  viewMode?: 'default' | 'compact' | 'detailed';
  onViewModeChange?: (mode: 'default' | 'compact' | 'detailed') => void;
}

export default function ViewLayer({
  children,
  title,
  actions,
  viewMode = 'default',
  onViewModeChange,
}: ViewLayerProps) {
  return (
    <div className={`view-layer view-layer-${viewMode}`}>
      {(title || actions || onViewModeChange) && (
        <div className="view-layer-header">
          {title && <h2 className="view-layer-title">{title}</h2>}
          <div className="view-layer-controls">
            {onViewModeChange && (
              <div className="view-mode-toggle">
                <button
                  className={viewMode === 'compact' ? 'active' : ''}
                  onClick={() => onViewModeChange('compact')}
                  title="Compact View"
                >
                  ⊟
                </button>
                <button
                  className={viewMode === 'default' ? 'active' : ''}
                  onClick={() => onViewModeChange('default')}
                  title="Default View"
                >
                  ⊞
                </button>
                <button
                  className={viewMode === 'detailed' ? 'active' : ''}
                  onClick={() => onViewModeChange('detailed')}
                  title="Detailed View"
                >
                  ⊠
                </button>
              </div>
            )}
            {actions && <div className="view-layer-actions">{actions}</div>}
          </div>
        </div>
      )}
      <div className="view-layer-content">{children}</div>
    </div>
  );
}

