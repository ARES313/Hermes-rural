import React from 'react';

/**
 * SkeletonLoader — Componente de carga animado con estilo glassmorphism.
 *
 * Variantes:
 *   - card:     skeleton de tarjeta (header + 2 líneas)
 *   - table:    skeleton de fila de tabla (5 celdas)
 *   - list:     skeleton de ítem de lista (ícono + 3 líneas)
 *   - text:     línea de texto simple
 *   - page:     página completa (tarjeta de info + grid de tarjetas)
 */
const SkeletonLoader = ({ variant = 'card', count = 1 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = (key) => {
    switch (variant) {
      case 'table':
        return (
          <div key={key} className="skeleton-row">
            <div className="skeleton-cell" style={{ width: '8%' }} />
            <div className="skeleton-cell" style={{ width: '30%' }} />
            <div className="skeleton-cell" style={{ width: '25%' }} />
            <div className="skeleton-cell" style={{ width: '15%' }} />
            <div className="skeleton-cell" style={{ width: '22%' }} />
          </div>
        );

      case 'list':
        return (
          <div key={key} className="skeleton-card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div className="skeleton-shape" style={{ width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ width: '70%', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-line" style={{ width: '90%', height: '12px', marginBottom: '6px' }} />
              <div className="skeleton-line" style={{ width: '40%', height: '12px' }} />
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={key} style={{ padding: '8px 0' }}>
            <div className="skeleton-line" style={{ width: '60%', height: '14px' }} />
          </div>
        );

      case 'page':
        return (
          <div key={key}>
            {/* Info card skeleton */}
            <div className="skeleton-card" style={{ marginBottom: '24px' }}>
              <div className="skeleton-line" style={{ width: '40%', height: '18px', marginBottom: '16px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[1, 2, 3, 4].map((n) => (
                  <div key={n}>
                    <div className="skeleton-line" style={{ width: '60%', height: '12px', marginBottom: '6px' }} />
                    <div className="skeleton-line" style={{ width: '80%', height: '14px' }} />
                  </div>
                ))}
              </div>
            </div>
            {/* Action cards grid skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-card" style={{ textAlign: 'center' }}>
                  <div className="skeleton-line" style={{ width: '50%', height: '16px', margin: '0 auto 10px' }} />
                  <div className="skeleton-line" style={{ width: '70%', height: '12px', margin: '0 auto' }} />
                </div>
              ))}
            </div>
            {/* List skeleton */}
            {[1, 2].map((n) => (
              <div key={n} className="skeleton-card" style={{ marginBottom: '12px' }}>
                <div className="skeleton-line" style={{ width: '50%', height: '16px', marginBottom: '8px' }} />
                <div className="skeleton-line" style={{ width: '90%', height: '12px', marginBottom: '4px' }} />
                <div className="skeleton-line" style={{ width: '30%', height: '12px' }} />
              </div>
            ))}
          </div>
        );

      case 'card':
      default:
        return (
          <div key={key} className="skeleton-card">
            <div className="skeleton-line" style={{ width: '60%', height: '18px', marginBottom: '12px' }} />
            <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
            <div className="skeleton-line" style={{ width: '40%', height: '14px' }} />
          </div>
        );
    }
  };

  return <div className="skeleton-wrapper">{items.map(renderSkeleton)}</div>;
};

export default SkeletonLoader;
