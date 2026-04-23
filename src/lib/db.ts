import { collection, doc, getDocs, getDoc, query, where, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError } from './errorHandler';
import { Exam, Attempt } from '../types';

export const getExams = async (userId: string): Promise<Exam[]> => {
  try {
    const q = query(collection(db, 'exams'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Exam)).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, 'list', '/exams');
    return [];
  }
};

export const getAttempts = async (userId: string): Promise<Attempt[]> => {
  try {
    const q = query(collection(db, 'attempts'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Attempt)).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    handleFirestoreError(error, 'list', '/attempts');
    return [];
  }
};

export const createExam = async (exam: Omit<Exam, 'id'>): Promise<Exam> => {
  try {
    const newDocRef = doc(collection(db, 'exams'));
    await setDoc(newDocRef, exam);
    return { ...exam, id: newDocRef.id };
  } catch (error) {
    handleFirestoreError(error, 'create', '/exams');
    throw error;
  }
};

export const getExamById = async (id: string): Promise<Exam | null> => {
  try {
    const d = await getDoc(doc(db, 'exams', id));
    if (d.exists()) {
      return { ...d.data(), id: d.id } as Exam;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'get', `/exams/${id}`);
    return null;
  }
};

export const createAttempt = async (attempt: Omit<Attempt, 'id'>): Promise<Attempt> => {
  try {
    const ref = doc(collection(db, 'attempts'));
    await setDoc(ref, attempt);
    return { ...attempt, id: ref.id };
  } catch (error) {
    handleFirestoreError(error, 'create', '/attempts');
    throw error;
  }
};

export const getAttemptById = async (id: string): Promise<Attempt | null> => {
  try {
    const d = await getDoc(doc(db, 'attempts', id));
    if (d.exists()) {
      return { ...d.data(), id: d.id } as Attempt;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'get', `/attempts/${id}`);
    return null;
  }
};
