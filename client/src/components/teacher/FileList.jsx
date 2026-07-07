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
        return <div style={{ textAlign: 'center', padding: '40px' }}>Cargando archivos...</div>;
    }

    if (!files.length) {
        return <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No hay archivos en esta ubicación</div>;
    }

    return (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f5f5f5' }}>
                    <tr>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Tipo</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Nombre original</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Tamaño</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Subido por</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Ver/Descargar</th>
                    </tr>
                </thead>
                <tbody>
                    {files.map((file) => (
                        <tr key={file.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <td style={{ color: '#F5E6B8', padding: '12px' }}>{getFileIcon(file.file_type || file.mime_type || '')}</td>
                            <td style={{ color: '#F5E6B8', padding: '12px' }}>{file.original_name || file.name || '-'}</td>
                            <td style={{ color: '#F5E6B8', padding: '12px' }}>{formatFileSize(file.file_size || file.size || 0)}</td>
                            <td style={{ color: '#F5E6B8', padding: '12px' }}>{file.uploaded_by_name || file.created_by_name || file.teacher_name || '—'}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                <a
                                    href={`http://localhost:3000/api/classes/${file.class_id}/content/${file.id}/download`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        marginRight: '5px',
                                        padding: '5px 10px',
                                        backgroundColor: '#2196f3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        textDecoration: 'none'
                                    }}
                                >
                                    Ver/Descargar
                                </a>
                                <button
                                    type="button"
                                    onClick={() => onMove(file)}
                                    style={{
                                        marginRight: '5px',
                                        padding: '5px 10px',
                                        backgroundColor: '#ff9800',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Mover
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onDelete(file.id, file.original_name || file.name || 'archivo')}
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FileList;