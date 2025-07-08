'use client'; // If you're using /app folder in Next.js 13+

import { auth, db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [grades, setGrades] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const docSnap = await getDoc(doc(db, 'users', u.uid));
        if (docSnap.exists()) {
          setNotes(docSnap.data()?.notes || '');
        }
        const q = query(
          collection(db, 'users', u.uid, 'grades'),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        setGrades(snapshot.docs.map(doc => doc.data().grade));
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) return;

    await setDoc(doc(db, 'users', user.uid), { notes });

    if (newGrade) {
      await addDoc(collection(db, 'users', user.uid, 'grades'), {
        grade: newGrade,
        timestamp: new Date(),
      });
      setNewGrade('');
    }
  };

  return (
    <main className="p-8">
      {!user ? (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
        >
          Entrar com Google
        </button>
      ) : (
        <>
          <p className="mb-4">
            Olá, {user.displayName}{' '}
            <button
              className="ml-4 underline text-red-500"
              onClick={() => signOut(auth)}
            >
              Sair
            </button>
          </p>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border"
            rows={5}
            placeholder="Anotações..."
          />

          <div className="mt-4 flex gap-2">
            <input
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              placeholder="Nova nota"
              className="border p-2"
            />
            <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded">
              Salvar
            </button>
          </div>

          <h3 className="mt-6 font-bold">Notas</h3>
          <ul className="list-disc list-inside">
            {grades.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </>
      )}
    </main>
  );
}
