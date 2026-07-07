import React from 'react';

const FileList = ({ files = [], onMove, onDelete, loading }) => {
    const formatFileSize = (bytes) => {
        const value = Number(bytes || 0);
        if (!value) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.min(Math.floor(Math.log(value) / Math.log(k)), sizes.length - 1);
        return `${parseFloat((value / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const getFileIcon = (fileType) => {
        const type = String(fileType || '').toLowerCase();
        if (type.includes('pdf')) return '📄';
        if (type.includes('image')) return '🖼️';
        if (type.includes('video')) return '🎥';
        if (type.includes('word') || type.includes('doc')) return '📝';
        if (type.includes('excel') || type.includes('sheet')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
        return '📎';
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.7)' }}>Cargando archivos...</div>;
    }

    if (!files.length) {
        return <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.6)' }}>No hay archivos en esta ubicación</div>;
    }

    return (
        <div style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <tr>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#f5e6b8', fontWeight: 500 }}>Tipo</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#f5e6b8', fontWeight: 500 }}>Nombre original</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#f5e6b8', fontWeight: 500 }}>Tamaño</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#f5e6b8', fontWeight: 500 }}>Subido por</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: '#f5e6b8', fontWeight: 500 }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((file) => (
                        <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <td style={{ color: '#f5e6b8', padding: '12px' }}>{getFileIcon(file.file_type || file.mime_type || '')}</td>
                            <td style={{ color: '#f5e6b8', padding: '12px' }}>{file.original_name || file.name || '-'}</td>
                            <td style={{ color: 'rgba(255,255,255,0.7)', padding: '12px' }}>{formatFileSize(file.file_size || file.size || 0)}</td>
                            <td style={{ color: 'rgba(255,255,255,0.7)', padding: '12px' }}>{file.uploaded_by_name || file.created_by_name || file.teacher_name || '—'}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    {/* Botón Ver */}
                                    <a
                                        href={`http://localhost:3000/api/classes/${file.class_id}/content/${file.id}/view`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #6c5ce7, #0984e3)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(108,92,231,0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        👁️ Ver
                                    </a>
                                    {/* Botón Descargar */}
                                    <a
                                        href={`http://localhost:3000/api/classes/${file.class_id}/content/${file.id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(46,204,113,0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        ⬇️ Descargar
                                    </a>
                                    {/* Botón Mover */}
                                    <button
                                        type="button"
                                        onClick={() => onMove(file)}
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #f39c12, #f1c40f)',
                                            color: '#212529',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(241,196,15,0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        Mover
                                    </button>
                                    {/* Botón Eliminar */}
                                    <button
                                        type="button"
                                        onClick={() => onDelete(file.id, file.original_name || file.name || 'archivo')}
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(231,76,60,0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FileList;
