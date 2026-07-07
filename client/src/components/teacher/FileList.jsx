import React, { useState } from 'react';

const FileList = ({ files = [], onMove, onDelete, loading }) => {
    const [busyFileId, setBusyFileId] = useState(null);

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

    const handleView = async (file) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado');
            return;
        }

        try {
            setBusyFileId(file.id);
            const response = await fetch(
                `http://localhost:3000/api/classes/${file.class_id}/content/${file.id}/view`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al abrir el archivo');
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
        } catch (err) {
            console.error('Error al abrir archivo:', err);
            alert(err.message || 'No se pudo abrir el archivo');
        } finally {
            setBusyFileId(null);
        }
    };

    const handleDownload = async (file) => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado');
            return;
        }

        try {
            setBusyFileId(file.id);
            const response = await fetch(
                `http://localhost:3000/api/classes/${file.class_id}/content/${file.id}/download`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al descargar el archivo');
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.original_name || file.originalname || file.name || 'archivo';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Error al descargar archivo:', err);
            alert(err.message || 'No se pudo descargar el archivo');
        } finally {
            setBusyFileId(null);
        }
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
                                    <button
                                        type="button"
                                        onClick={() => handleView(file)}
                                        disabled={busyFileId === file.id}
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #6c5ce7, #0984e3)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: busyFileId === file.id ? 'wait' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: busyFileId === file.id ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (busyFileId !== file.id) {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(108,92,231,0.4)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        👁️ {busyFileId === file.id ? 'Cargando...' : 'Ver'}
                                    </button>
                                    {/* Botón Descargar */}
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(file)}
                                        disabled={busyFileId === file.id}
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: busyFileId === file.id ? 'wait' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: busyFileId === file.id ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (busyFileId !== file.id) {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(46,204,113,0.4)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        ⬇️ {busyFileId === file.id ? 'Descargando...' : 'Descargar'}
                                    </button>
                                    {/* Botón Mover */}
                                    <button
                                        type="button"
                                        onClick={() => onMove(file)}
                                        disabled={busyFileId === file.id}
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #f39c12, #f1c40f)',
                                            color: '#212529',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: busyFileId === file.id ? 'wait' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            opacity: busyFileId === file.id ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (busyFileId !== file.id) {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(241,196,15,0.4)';
                                            }
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
                                        disabled={busyFileId === file.id}
                                        style={{
                                            padding: '6px 14px',
                                            background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: busyFileId === file.id ? 'wait' : 'pointer',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            opacity: busyFileId === file.id ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (busyFileId !== file.id) {
                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(231,76,60,0.4)';
                                            }
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