import { db } from './firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ChatMessage } from '../types';

const RIDES_COLLECTION = 'rides';
const MESSAGES_COLLECTION = 'messages';

export const sendMessage = async (rideId: string, senderId: string, text: string) => {
  if (!text.trim() || !db) return;

  try {
    await addDoc(collection(db, RIDES_COLLECTION, rideId, MESSAGES_COLLECTION), {
      rideId,
      senderId,
      text,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
};

export const subscribeToChat = (rideId: string, onUpdate: (messages: ChatMessage[]) => void) => {
  if (!db) return () => {};

  const q = query(
    collection(db, RIDES_COLLECTION, rideId, MESSAGES_COLLECTION),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        rideId: data.rideId,
        senderId: data.senderId,
        text: data.text,
        createdAt: data.createdAt ? (data.createdAt as any).seconds * 1000 : Date.now()
      });
    });
    onUpdate(messages);
  });
};
