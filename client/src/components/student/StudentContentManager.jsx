import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { getStudentClassContent } from '../../services/api';
import { useModal } from '../../features/modal/ModalContext';
import SkeletonLoader from '../SkeletonLoader';

const StudentContentManager = ({ classId, viewUrl, downloadUrl }) => {
    const { showAlert } = useModal();
    const [allFiles, setAllFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busyFileId, setBusyFileId] = useState(null);

    useEffect(() => {
        if (!classId) return;
        loadContent();
    }, [classId]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const response = await getStudentClassContent(classId);
            const content = response?.data?.content || [];
            const rawFolders = response?.data?.folders || [];

            setAllFiles(content);

            const folderMap = new Map();
            rawFolders.forEach((folder) => {
                folderMap.set(String(folder.id), {
                    id: folder.id,
                    name: folder.name,
                    parentId: folder.parentid ?? folder.parent_id ?? null,
                    path: folder.path || '',
                    children: []
                });
            });

            folderMap.forEach((folder) => {
                if (folder.parentId !== null && folderMap.has(String(folder.parentId))) {
                    folderMap.get(String(folder.parentId)).children.push(folder);
                }
            });

            const rootFolders = Array.from(folderMap.values())
                .filter((folder) => folder.parentId === null)
                .sort((a, b) => (a.path || '').localeCompare(b.path || ''));

            setFolders(rootFolders);
            setError('');
        } catch (err) {
            console.error('Error al cargar contenido del estudiante:', err);
            setError(err.response?.data?.message || 'Error al cargar recursos');
        } finally {
            setLoading(false);
        }
    };

    const visibleFiles = useMemo(() => {
        if (selectedFolderId === null) {
            return allFiles.filter(
                (file) => file.folder_id === null || file.folder_id === undefined
            );
        }

        return allFiles.filter(
            (file) => String(file.folder_id) === String(selectedFolderId)
        );
    }, [allFiles, selectedFolderId]);

    const flattenFolders = (items) => {
        const result = [];
        const walk = (list) => {
            list.forEach((item) => {
                result.push(item);
                if (item.children?.length) walk(item.children);
            });
        };
        walk(items);
        return result;
    };

    const getBreadcrumb = () => {
        if (selectedFolderId === null) return 'Raíz';
        const flat = flattenFolders(folders);
        const current = flat.find((folder) => String(folder.id) === String(selectedFolderId));
        if (!current) return 'Carpeta';
        if (!current.path) return current.name;
        const normalized = current.path.startsWith('/') ? current.path.slice(1) : current.path;
        return normalized.split('/').join(' / ');
    };

    const getToken = () => {
        return (
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('authToken')
        );
    };

    const fetchBlob = async (url) => {
        const token = getToken();
        return axios.get(url, {
            responseType: 'blob',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
    };

    const handleView = async (file) => {
        try {
            setBusyFileId(file.id);
            const response = await fetchBlob(viewUrl(file.id));
            const blobUrl = window.URL.createObjectURL(response.data);
            window.open(blobUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
        } catch (err) {
            console.error('Error al abrir archivo:', err);
            showAlert(err.response?.data?.message || 'No se pudo abrir el archivo', 'error');
        } finally {
            setBusyFileId(null);
        }
    };

    const handleDownload = async (file) => {
        try {
            setBusyFileId(file.id);
            const response = await fetchBlob(downloadUrl(file.id));
            const blobUrl = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = file.original_name || file.originalname || file.name || 'archivo';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Error al descargar archivo:', err);
            showAlert(err.response?.data?.message || 'No se pudo descargar el archivo', 'error');
        } finally {
            setBusyFileId(null);
        }
    };

    const renderFolder = (folder, level = 0) => {
        const isSelected = String(selectedFolderId) === String(folder.id);

        return (
            <div key={folder.id}>
                <div
                    onClick={() => setSelectedFolderId(folder.id)}
                    style={{
                        padding: '8px 12px',
                        paddingLeft: `${12 + level * 18}px`,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.25)' : 'transparent',
                        borderLeft: isSelected ? '3px solid #6c5ce7' : '3px solid transparent',
                        marginBottom: '2px',
                        borderRadius: '4px',
                        color: isSelected ? '#f5e6b8' : 'rgba(255,255,255,0.7)',
                        transition: 'all 0.2s',
                        fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    📁 {folder.name}
                </div>

                {folder.children?.map((child) => renderFolder(child, level + 1))}
            </div>
        );
    };

    if (loading) {
        return <SkeletonLoader variant="table" count={4} />;
    }

    return (
        <div>
            {error && (
                <div
                    style={{
                        padding: '10px',
                        backgroundColor: 'rgba(220,53,69,0.2)',
                        color: '#f8d7da',
                        borderRadius: '8px',
                        border: '1px solid rgba(220,53,69,0.3)',
                        marginBottom: '20px'
                    }}
                >
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
                {/* Panel de Carpetas */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    padding: '15px',
                    height: 'fit-content'
                }}>
                    <div style={{
                        marginBottom: '12px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <h3 style={{ margin: 0, color: '#f5e6b8', fontSize: '16px' }}>📁 Carpetas</h3>
                    </div>

                    <div
                        onClick={() => setSelectedFolderId(null)}
                        style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedFolderId === null ? 'rgba(108, 92, 231, 0.25)' : 'transparent',
                            borderLeft: selectedFolderId === null ? '3px solid #6c5ce7' : '3px solid transparent',
                            marginBottom: '10px',
                            borderRadius: '4px',
                            color: selectedFolderId === null ? '#f5e6b8' : 'rgba(255,255,255,0.7)',
                            transition: 'all 0.2s',
                            fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedFolderId !== null) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                            if (selectedFolderId !== null) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        🏠 Raíz
                    </div>

                    {folders.length === 0 ? (
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>No hay carpetas</div>
                    ) : (
                        folders.map((folder) => renderFolder(folder))
                    )}
                </div>

                {/* Panel de Contenido */}
                <div>
                    <div
                        style={{
                            marginBottom: '15px',
                            padding: '12px 15px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '14px'
                        }}
                    >
                        <strong style={{ color: '#f5e6b8' }}>📍 Ubicación:</strong> {getBreadcrumb()}
                        <span style={{ marginLeft: '15px', color: 'rgba(255,255,255,0.5)' }}>
                            ({visibleFiles.length} archivos)
                        </span>
                    </div>

                    {visibleFiles.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: 'rgba(255,255,255,0.7)'
                        }}>
                            No hay archivos en esta ubicación
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            overflow: 'hidden'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '12px 15px', textAlign: 'left', color: '#f5e6b8', fontWeight: 'bold' }}>Nombre</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'left', color: '#f5e6b8', fontWeight: 'bold' }}>Tipo</th>
                                        <th style={{ padding: '12px 15px', textAlign: 'center', color: '#f5e6b8', fontWeight: 'bold' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleFiles.map((file) => (
                                        <tr key={file.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '12px 15px', color: 'rgba(255,255,255,0.8)' }}>
                                                {file.original_name || file.originalname || file.name || 'Archivo'}
                                            </td>
                                            <td style={{ padding: '12px 15px', color: 'rgba(255,255,255,0.6)' }}>
                                                {file.file_type || file.filetype || file.mime_type || 'Documento'}
                                            </td>
                                            <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleView(file)}
                                                    disabled={busyFileId === file.id}
                                                    style={{
                                                        display: 'inline-block',
                                                        marginRight: '8px',
                                                        padding: '6px 14px',
                                                        background: 'linear-gradient(135deg, #6c5ce7, #0984e3)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: busyFileId === file.id ? 'wait' : 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        opacity: busyFileId === file.id ? 0.6 : 1,
                                                        transition: 'transform 0.2s, box-shadow 0.2s'
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

                                                <button
                                                    type="button"
                                                    onClick={() => handleDownload(file)}
                                                    disabled={busyFileId === file.id}
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '6px 14px',
                                                        background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        cursor: busyFileId === file.id ? 'wait' : 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        opacity: busyFileId === file.id ? 0.6 : 1,
                                                        transition: 'transform 0.2s, box-shadow 0.2s'
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentContentManager;
