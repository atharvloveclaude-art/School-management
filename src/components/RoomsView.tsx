import React, { useState } from 'react';
import { Room } from '../types';

interface RoomsViewProps {
  rooms: Room[];
  onSaveRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  onSaveRoom,
  onDeleteRoom
}) => {
  const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingRoom({
      id: '',
      capacity: 40,
      type: 'Classroom'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: Room) => {
    setEditingRoom({ ...r });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom || !editingRoom.id) return;
    onSaveRoom({
      id: editingRoom.id,
      capacity: Number(editingRoom.capacity) || 40,
      type: editingRoom.type || 'Classroom'
    });
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h2>Rooms Management</h2>
          <p>Classroom, laboratory, and facility allocations</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
          + Add Room
        </button>
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Room Number</th>
              <th>Capacity (Students)</th>
              <th>Type</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>
                  <strong>Room {room.id}</strong>
                </td>
                <td>{room.capacity} seats</td>
                <td>{room.type}</td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginRight: '6px' }}
                    onClick={() => handleOpenEdit(room)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (window.confirm(`Delete Room ${room.id}?`)) {
                        onDeleteRoom(room.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingRoom && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>{editingRoom.id ? 'Edit Room' : 'Add Room'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="rm-id">Room Identifier / Number:</label>
                  <input
                    id="rm-id"
                    type="text"
                    required
                    value={editingRoom.id || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, id: e.target.value })}
                    placeholder="e.g. 204, 205, LAB-1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rm-cap">Capacity (Students):</label>
                  <input
                    id="rm-cap"
                    type="number"
                    required
                    min="1"
                    max="200"
                    value={editingRoom.capacity || 40}
                    onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="rm-type">Room Type:</label>
                  <select
                    id="rm-type"
                    value={editingRoom.type || 'Classroom'}
                    onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value })}
                  >
                    <option value="Classroom">Classroom</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Computer Lab">Computer Lab</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Library">Library</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
