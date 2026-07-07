import React, { useEffect, useRef, useState } from 'react';
import {
    getFolders,
    createFolder,
    deleteFolder,
    moveContent,
    getClassContentByFolder,
    deleteContent,
    uploadContent
} from '../../services/api';
import FolderTree from './FolderTree';
import FileList from './FileList';
import MoveFileModal from './MoveFileModal';

const TeacherContentManager = ({ classId }) => {
    const [folders, setFolders] = useState([]);
    const [flatFolders, setFlatFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const buildFlatFolders = (tree) => {
        const flat = [];

        const walk = (nodes) => {
            (nodes || []).forEach((folder) => {
                flat.push(folder);
                if (Array.isArray(folder.children) && folder.children.length > 0) {
                    walk(folder.children);
                }
            });
        };

        walk(tree);
        return flat;
    };

    const loadFolders = async () => {
        try {
            const response = await getFolders(classId);
            const treeFolders = response?.data?.folders || [];
            const responseFlatFolders = response?.data?.flat_folders || [];

            setFolders(treeFolders);
            setFlatFolders(responseFlatFolders.length ? responseFlatFolders : buildFlatFolders(treeFolders));
        } catch (err) {
            console.error('Error al cargar carpetas:', err);
            setError(err.response?.data?.message || 'Error al cargar las carpetas');
        }
    };

    const loadContent = async () => {
        setLoading(true);
        try {
            const response = await getClassContentByFolder(classId, selectedFolderId);
            setContent(response?.data?.content || []);
            setError('');
        } catch (err) {
            console.error('Error al cargar contenido:', err);
            setError(err.response?.data?.message || 'Error al cargar los archivos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!classId) return;
        loadFolders();
    }, [classId]);

    useEffect(() => {
        if (!classId) return;
        loadContent();
    }, [classId, selectedFolderId]);

    const handleCreateFolder = async (_classId, data) => {
        try {
            await createFolder(_classId, data);
            await loadFolders();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al crear carpeta');
        }
    };

    const handleDeleteFolder = async (_classId, folderId) => {
        const confirmed = window.confirm('¿Eliminar esta carpeta? Solo se puede si está vacía.');
        if (!confirmed) return;

        try {
            await deleteFolder(_classId, folderId);

            if (selectedFolderId === folderId) {
                setSelectedFolderId(null);
            }

            await loadFolders();
            await loadContent();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar carpeta');
        }
    };

    const handleMoveFile = async (_classId, fileId, data) => {
        try {
            await moveContent(_classId, fileId, data);
            await loadContent();
            await loadFolders();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al mover archivo');
            throw err;
        }
    };

    const handleDeleteFile = async (fileId, fileName) => {
        const confirmed = window.confirm(`¿Eliminar "${fileName}"?`);
        if (!confirmed) return;

        try {
            await deleteContent(classId, fileId);
            await loadContent();
            await loadFolders();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al eliminar archivo');
        }
    };

    const handleOpenFilePicker = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
};

    const handleUploadFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        if (selectedFolderId !== null && selectedFolderId !== undefined) {
            formData.append('folder_id', selectedFolderId);
        }

        try {
            setUploading(true);
            await uploadContent(classId, formData);
            await loadContent();
            await loadFolders();
        } catch (err) {
            console.error('Error al subir archivo:', err);
            alert(err.response?.data?.message || 'Error al subir archivo');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const openMoveModal = (file) => {
        setSelectedFile(file);
        setShowMoveModal(true);
    };

    const getBreadcrumb = () => {
        if (!selectedFolderId) return 'Raíz';

        const current = flatFolders.find((folder) => folder.id === selectedFolderId);
        if (!current) return 'Carpeta';

        const parts = [current.name];
        let parentId = current.parent_id;

        while (parentId) {
            const parent = flatFolders.find((folder) => folder.id === parentId);
            if (!parent) break;
            parts.unshift(parent.name);
            parentId = parent.parent_id;
        }

        return parts.join(' / ');
    };

    return (
        <div>
            {error && (
                <div
                    style={{
                        padding: '10px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}
                >
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
                <div>
                    <FolderTree
                        folders={folders}
                        selectedFolderId={selectedFolderId}
                        onSelectFolder={setSelectedFolderId}
                        onCreateFolder={handleCreateFolder}
                        onDeleteFolder={handleDeleteFolder}
                        classId={classId}
                    />
                </div>

                <div>
    <div
        style={{
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
        }}
    >
        <div>
            <strong>📍 Ubicación:</strong> {getBreadcrumb()}
            <span style={{ marginLeft: '15px', color: '#666' }}>
                ({content.length} archivos)
            </span>
        </div>

            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleUploadFile}
                />
                <button
                    type="button"
                    onClick={handleOpenFilePicker}
                    disabled={uploading}
                    style={{
                        padding: '8px 14px',
                        backgroundColor: uploading ? '#90caf9' : '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {uploading ? 'Subiendo...' : '+ Agregar archivo'}
                </button>
            </div>
        </div>

        <FileList
            files={content}
            onMove={openMoveModal}
            onDelete={handleDeleteFile}
            loading={loading}
        />
    </div>
            </div>

            <MoveFileModal
                isOpen={showMoveModal}
                file={selectedFile}
                folders={flatFolders}
                currentFolderId={selectedFolderId}
                onClose={() => setShowMoveModal(false)}
                onMove={handleMoveFile}
                classId={classId}
            />
        </div>
    );
};

export default TeacherContentManager;