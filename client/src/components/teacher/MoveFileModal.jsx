import React, { useEffect, useState } from 'react';

const MoveFileModal = ({ isOpen, file, folders = [], currentFolderId, onClose, onMove, classId }) => {
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedFolderId('');
            setLoading(false);
        }
    }, [isOpen, file]);

    if (!isOpen || !file) return null;

    const availableFolders = folders.filter((f) => f.id !== currentFolderId);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const targetFolderId = selectedFolderId === '' ? null : Number(selectedFolderId);
            await onMove(classId, file.id, { folder_id: targetFolderId });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
        >
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', width: '400px', maxWidth: '90%' }}>
                <h3>Mover archivo</h3>
                <p><strong>{file.original_name || file.name || 'Archivo'}</strong></p>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Mover a:</label>
                    <select
                        value={selectedFolderId}
                        onChange={(e) => setSelectedFolderId(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="">📁 Raíz</option>
                        {availableFolders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ padding: '8px 16px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        style={{ padding: '8px 16px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        disabled={loading}
                    >
                        {loading ? 'Moviendo...' : 'Mover'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoveFileModal;