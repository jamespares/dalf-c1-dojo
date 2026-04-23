import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { signInWithGoogle } from '../lib/firebase';

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center max-w-2xl mx-auto">
      <span className="text-[10px] uppercase tracking-[0.4em] font-bold mb-4 block">Préparation Intensive</span>
      <h1 className="text-7xl font-serif leading-[0.9] mb-8">
        Nouvel <br/> <span className="italic">Examen</span> <br/> Blanc
      </h1>
      <p className="text-sm leading-relaxed mb-10 opacity-70 italic font-serif">
        Générez une épreuve complète incluant compréhension orale, écrite, ainsi que les sujets de production basés sur les derniers thèmes de France Éducation International.
      </p>
      
      <div className="flex flex-col gap-4 items-center">
        <Button size="lg" onClick={signInWithGoogle}>
          Commencer la Préparation
        </Button>
        <span className="text-[9px] opacity-40 uppercase tracking-widest">Connectez-vous pour commencer</span>
      </div>
    </div>
  );
}
