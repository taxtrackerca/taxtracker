// components/AdminUserNotes.jsx
import { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function AdminUserNotes({ userId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editedNote, setEditedNote] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      const q = query(
        collection(db, 'users', userId, 'adminNotes'),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    if (userId) fetchNotes();
  }, [userId]);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    await addDoc(collection(db, 'users', userId, 'adminNotes'), {
      text: newNote,
      timestamp: new Date().toISOString(),
    });
    setNewNote('');
    const snap = await getDocs(collection(db, 'users', userId, 'adminNotes'));
    setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (noteId) => {
    await deleteDoc(doc(db, 'users', userId, 'adminNotes', noteId));
    setNotes(notes.filter(note => note.id !== noteId));
  };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setEditedNote(note.text);
  };

  const handleSave = async () => {
    const noteRef = doc(db, 'users', userId, 'adminNotes', editingId);
    await updateDoc(noteRef, { text: editedNote });
    setEditingId(null);
    setEditedNote('');
    const snap = await getDocs(collection(db, 'users', userId, 'adminNotes'));
    setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold mb-2">Admin Notes</h3>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note"
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500">
          Add
        </button>
      </div>

      <ul className="space-y-2 text-sm">
        {notes.map(note => (
          <li key={note.id} className="border rounded p-2 bg-gray-50 flex justify-between items-start">
            {editingId === note.id ? (
              <div className="flex flex-col w-full">
                <textarea
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  className="border p-2 rounded mb-2 w-full"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Save</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 text-gray-800">{note.text}</span>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => handleEdit(note)} className="text-blue-600">Edit</button>
                  <button onClick={() => handleDelete(note.id)} className="text-red-600">Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
