import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAttemptById, getExamById } from '../lib/db';
import Markdown from 'react-markdown';
import { Attempt, ExamContent } from '../types';
import { Button } from '../components/ui/Button';

export default function ReviewView() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [examContent, setExamContent] = useState<ExamContent | null>(null);
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    if (attemptId) {
      getAttemptById(attemptId).then(a => {
        if (a) {
          setAttempt(a);
          if (a.feedback) {
            try {
              setFeedback(JSON.parse(a.feedback));
            } catch(e) {}
          }
          getExamById(a.examId).then(e => {
            if (e) {
              try {
                setExamContent(JSON.parse(e.content));
              } catch(err){}
            }
          });
        }
      });
    }
  }, [attemptId]);

  if (!attempt) return <div className="p-10 text-center font-serif italic">Chargement de la correction...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 mb-20">
      <div className="flex justify-between items-end border-b border-[#1A1A1A] pb-8 mb-12">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 block mb-4">Correction et Bilan</span>
          <h1 className="text-5xl font-serif italic tracking-tighter">Votre Résultat</h1>
          <p className="text-sm font-mono uppercase opacity-70 mt-4">Le {new Date(attempt.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 mb-2">Note Globale</span>
          <div className="text-7xl font-light">
            {feedback ? feedback.score : attempt.score}<span className="text-2xl">/100</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#1A1A1A] pb-12">
          <section className="p-8 bg-[#F9F7F2] border border-[#1A1A1A]">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-60 border-b border-[#1A1A1A] pb-2">Points Faibles (Grammaire)</h3>
            <ul className="space-y-4 font-serif text-sm">
              {feedback.grammarErrors?.length ? feedback.grammarErrors.map((err: string, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-500 font-bold">-</span>
                  <span>{err}</span>
                </li>
              )) : <li className="italic opacity-60">Aucune erreur grammaticale majeure détectée.</li>}
            </ul>
          </section>
          <section className="p-8 bg-white border border-[#1A1A1A]">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-60 border-b border-[#1A1A1A] pb-2">Lexique & Vocabulaire</h3>
            <ul className="space-y-4 font-serif text-sm">
              {feedback.vocabErrors?.length ? feedback.vocabErrors.map((err: string, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="text-orange-500 font-bold">-</span>
                  <span>{err}</span>
                </li>
              )) : <li className="italic opacity-60">Excellent niveau lexical.</li>}
            </ul>
          </section>
        </div>
      )}

      {feedback && feedback.feedback && (
        <section className="bg-white p-12 border border-[#1A1A1A] font-serif leading-relaxed text-sm">
          <h3 className="text-xs font-sans font-bold uppercase tracking-widest mb-8 opacity-60 border-b border-[#1A1A1A] pb-4">Commentaire Détaillé de l'Évaluateur</h3>
          <div className="prose max-w-none prose-p:mb-4 prose-h2:text-lg prose-h2:font-sans prose-h2:uppercase prose-h2:tracking-widest prose-h2:mt-8 prose-h2:mb-4 prose-li:my-1">
            <Markdown>{feedback.feedback}</Markdown>
          </div>
        </section>
      )}

      <div className="flex justify-center mt-12">
        <Link to="/dashboard">
          <Button size="lg" variant="outline" className="w-full md:w-auto">
            Retour au Tableau de Bord
          </Button>
        </Link>
      </div>
    </div>
  );
}
