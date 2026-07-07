import React, { useState } from 'react';

const FolderTree = ({
    folders,
    selectedFolderId,
    onSelectFolder,
    onCreateFolder,
    onDeleteFolder,
    classId
}) => {
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [parentId, setParentId] = useState(null);

    const openRootCreate = () => {
        setParentId(null);
        setNewFolderName('');
        setShowCreateInput(true);
    };

    const openSubfolderCreate = (folderId) => {
        setParentId(folderId);
        setNewFolderName('');
        setShowCreateInput(true);
    };

    const submitCreate = async () => {
        const name = newFolderName.trim();
        if (!name) return;
        await onCreateFolder(classId, { name, parent_id: parentId });
        setShowCreateInput(false);
        setNewFolderName('');
        setParentId(null);
    };

    const renderFolder = (folder, level = 0) => {
        const isSelected = selectedFolderId === folder.id;

        return (
            <div key={folder.id}>
                <div
                    style={{
                        padding: '8px 12px',
                        paddingLeft: `${12 + level * 18}px`,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#3f007d' : 'transparent',
                        borderLeft: isSelected ? '3px solid #F5E6B8' : '3px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '2px',
                        borderRadius: '4px'
                    }}
                >
                    <div
                        style={{ color: '#F5E6B8', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => onSelectFolder(folder.id)}
                    >
                        <span>📁</span>
                        <span>{folder.name}</span>
                        <span style={{ fontSize: '12px', color: '#ffffff' }}>
                            ({folder.file_count || 0})
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                openSubfolderCreate(folder.id);
                            }}
                            style={{ padding: '2px 8px', fontSize: '12px' }}
                            title="Crear subcarpeta"
                        >
                            +
                        </button>

                        {Number(folder.file_count || 0) === 0 && Number(folder.child_count || 0) === 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteFolder(classId, folder.id);
                                }}
                                style={{ padding: '2px 8px', fontSize: '12px', color: '#d32f2f' }}
                                title="Eliminar carpeta"
                            >
                                🗑
                            </button>
                        )}
                    </div>
                </div>

                {Array.isArray(folder.children) && folder.children.map((child) => renderFolder(child, level + 1))}
            </div>
        );
    };

    return (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '10px', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #e0e0e0' }}>
                <h3 style={{ margin: 0, color: '#ffffff' }}>Carpetas </h3>
                <button
                    type="button"
                    onClick={openRootCreate}
                    style={{ padding: '5px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + Carpeta
                </button>
            </div>

            <div
                onClick={() => onSelectFolder(null)}
                style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color : '#F5E6B8',
                    backgroundColor: selectedFolderId === null ? '#3f007d' : 'transparent',
                    borderLeft: selectedFolderId === null ? '3px solid #F5E6B8' : '3px solid transparent',
                    marginBottom: '10px',
                    borderRadius: '4px'
                }}
            >
                🏠 Raíz
            </div>

            {Array.isArray(folders) && folders.map((folder) => renderFolder(folder))}

            {showCreateInput && (
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#3f007d', borderRadius: '4px' }}>
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Nombre de la carpeta"
                        autoFocus
                        style={{ width: '100%', padding: '6px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') submitCreate();
                            if (e.key === 'Escape') {
                                setShowCreateInput(false);
                                setNewFolderName('');
                                setParentId(null);
                            }
                        }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={submitCreate} style={{ padding: '4px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Crear
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowCreateInput(false);
                                setNewFolderName('');
                                setParentId(null);
                            }}
                            style={{ padding: '4px 12px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FolderTree;