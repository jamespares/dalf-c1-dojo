import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExamById, createAttempt } from '../lib/db';
import { evaluateExamAttempt } from '../lib/genai';
import { Exam, ExamContent } from '../types';
import { Button } from '../components/ui/Button';
import Markdown from 'react-markdown';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ExamView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [content, setContent] = useState<ExamContent | null>(null);
  const [answers, setAnswers] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      getExamById(id).then(e => {
        if (e) {
          setExam(e);
          try {
            setContent(JSON.parse(e.content));
          } catch(err) { console.error("Invalid exam JSON", err); }
        }
      });
    }
  }, [id]);

  const handleTextChange = (path: string[], value: string) => {
    setAnswers((prev: any) => {
      const next = { ...prev };
      let current = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return next;
    });
  };

  const submitExam = async () => {
    if (!user || !id) return;
    setIsSubmitting(true);
    try {
      const answersStr = JSON.stringify(answers);
      const attempt = await createAttempt({
        userId: user.uid,
        examId: id,
        answers: answersStr,
        createdAt: Date.now()
      });

      // Submit to Gemini for evaluation
      const feedbackStr = await evaluateExamAttempt(exam!.content, answersStr);
      let feedbackParsed: any = {};
      try {
        feedbackParsed = JSON.parse(feedbackStr);
      } catch(e) {}

      // Update Attempt
      await updateDoc(doc(db, "attempts", attempt.id), {
        score: feedbackParsed.score || 0,
        feedback: feedbackStr
      });

      navigate(`/review/${attempt.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit and grade exam.");
      setIsSubmitting(false);
    }
  };

  if (!content) return <div className="p-10 text-center font-serif italic">Chargement de l'épreuve...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 mb-20">
      <div className="border-b border-[#1A1A1A] pb-8 mb-12">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 block mb-4">Épreuve Officielle</span>
        <h1 className="text-5xl font-serif italic tracking-tighter mb-4">{content.title}</h1>
        <p className="text-sm font-mono uppercase opacity-70">Thème: {content.theme}</p>
      </div>

      {/* Part 1 */}
      <section className="bg-[#F9F7F2] p-8 border border-[#1A1A1A] space-y-8">
        <h2 className="text-sm uppercase tracking-widest font-bold opacity-80 border-b border-[#1A1A1A] pb-4">{content.part1?.title}</h2>
        
        <div className="space-y-6">
          <h3 className="text-lg font-serif italic">1. Document Long</h3>
          <div className="p-6 bg-[#FDFCF9] border border-[#1A1A1A] text-sm text-[#1A1A1A] h-64 overflow-y-auto font-serif leading-relaxed">
            <strong className="font-sans uppercase tracking-widest text-[10px] opacity-50 block mb-4">Transcription Audio</strong> 
            {content.part1?.longDocument?.transcript}
          </div>
          {content.part1?.longDocument?.questions?.map((q: any, i: number) => (
            <div key={`p1lq${i}`} className="space-y-3 pt-4">
              <p className="font-bold text-sm">{i + 1}. {q.question}</p>
              {q.options ? (
                 <select 
                   className="w-full p-3 bg-[#FDFCF9] border border-[#1A1A1A] text-sm focus:outline-none focus:ring-1 focus:ring-black"
                   onChange={(e) => handleTextChange(['part1', 'long', i.toString()], e.target.value)}
                 >
                   <option value="">Sélectionner une réponse...</option>
                   {q.options.map((opt: string, optIdx: number) => (
                     <option key={optIdx} value={opt}>{opt}</option>
                   ))}
                 </select>
              ) : (
                <textarea 
                  className="w-full p-3 bg-[#FDFCF9] border border-[#1A1A1A] text-sm focus:outline-none focus:ring-1 focus:ring-black" rows={2}
                  onChange={(e) => handleTextChange(['part1', 'long', i.toString()], e.target.value)}
                  placeholder="Votre réponse..."
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Part 2 */}
      <section className="bg-white p-8 border border-[#1A1A1A] space-y-8">
        <h2 className="text-sm uppercase tracking-widest font-bold opacity-80 border-b border-[#1A1A1A] pb-4">{content.part2?.title}</h2>
        <div className="p-8 bg-[#FDFCF9] border border-[#1A1A1A] text-sm text-[#1A1A1A] h-96 overflow-y-auto font-serif leading-relaxed whitespace-pre-wrap">
           {content.part2?.text}
        </div>
        <div className="space-y-6">
          {content.part2?.questions?.map((q: any, i: number) => (
            <div key={`p2q${i}`} className="space-y-3 pt-4">
              <p className="font-bold text-sm">{i + 1}. {q.question}</p>
              {q.options ? (
                 <select 
                   className="w-full p-3 bg-[#FDFCF9] border border-[#1A1A1A] text-sm focus:outline-none focus:ring-1 focus:ring-black"
                   onChange={(e) => handleTextChange(['part2', i.toString()], e.target.value)}
                 >
                   <option value="">Sélectionner une réponse...</option>
                   {q.options.map((opt: string, optIdx: number) => (
                     <option key={optIdx} value={opt}>{opt}</option>
                   ))}
                 </select>
              ) : (
                <textarea 
                  className="w-full p-3 bg-[#FDFCF9] border border-[#1A1A1A] text-sm focus:outline-none focus:ring-1 focus:ring-black" rows={2}
                  onChange={(e) => handleTextChange(['part2', i.toString()], e.target.value)}
                  placeholder="Votre réponse (citez le texte si nécessaire)..."
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Part 3 */}
      <section className="bg-[#F9F7F2] p-8 border border-[#1A1A1A] space-y-8">
        <h2 className="text-sm uppercase tracking-widest font-bold opacity-80 border-b border-[#1A1A1A] pb-4">{content.part3?.title}</h2>
        <p className="text-xs font-mono uppercase opacity-60">Domaine: {content.part3?.domain}</p>
        <div className="space-y-6 mt-6">
          <h3 className="text-lg font-serif italic">Documents Sources</h3>
          {content.part3?.sourceDocuments?.map((doc: string, i: number) => (
            <div key={i} className="p-6 bg-[#FDFCF9] border border-[#1A1A1A] text-sm font-serif leading-relaxed whitespace-pre-wrap">
              <span className="font-sans uppercase tracking-widest text-[10px] opacity-50 block mb-4">Document {i+1}</span>
              {doc}
            </div>
          ))}
        </div>
        
        <div className="space-y-4 mt-12 bg-white p-6 border border-[#1A1A1A]">
          <h3 className="font-bold text-sm uppercase tracking-widest">Tâche 1: Synthèse</h3>
          <p className="text-sm font-serif italic opacity-80 mb-4">{content.part3?.task1Text}</p>
          <textarea 
            className="w-full p-4 bg-[#FDFCF9] border border-[#1A1A1A] text-sm focus:outline-none focus:ring-1 focus:ring-black font-serif leading-relaxed" rows={8}
            onChange={(e) => handleTextChange(['part3', 'task1'], e.target.value)}
            placeholder="Rédigez votre synthèse ici..."
          />
        </div>

        <div className="space-y-4 mt-8 bg-white p-6 border border-[#1A1A1A]">
          <h3 className="font-bold text-sm uppercase tracking-widest">Tâche 2: Essai argumenté</h3>
          <p className="text-sm font-serif italic opacity-80 mb-4">{content.part3?.task2Text}</p>
          <textarea 
            className="w-full p-4 bg-[#FDFCF9] border border-[#1A1A1A] text-sm focus:outline-none focus:ring-1 focus:ring-black font-serif leading-relaxed" rows={12}
            onChange={(e) => handleTextChange(['part3', 'task2'], e.target.value)}
            placeholder="Rédigez votre essai ici..."
          />
        </div>
      </section>

      {/* Part 4 */}
      <section className="bg-white p-8 border border-[#1A1A1A] space-y-8">
        <h2 className="text-sm uppercase tracking-widest font-bold opacity-80 border-b border-[#1A1A1A] pb-4">{content.part4?.title}</h2>
        <p className="text-[10px] font-mono uppercase text-red-600 mb-4">(Simulation écrite pour l'épreuve orale)</p>
        
        <div className="space-y-6">
          <h3 className="text-lg font-serif italic">Dossier de préparation</h3>
          {content.part4?.sourceDocuments?.map((doc: string, i: number) => (
            <div key={i} className="p-6 bg-[#FDFCF9] border border-[#1A1A1A] text-sm font-serif leading-relaxed whitespace-pre-wrap">
              {doc}
            </div>
          ))}
        </div>

        <div className="space-y-4 mt-8">
          <h3 className="font-bold text-sm uppercase tracking-widest">Tâche 1: Monologue Suivi</h3>
          <p className="text-sm font-serif italic opacity-80 mb-2">{content.part4?.task1Text}</p>
          <textarea 
            className="w-full p-4 bg-[#F9F7F2] border border-[#1A1A1A] text-sm font-serif focus:outline-none" rows={8}
            onChange={(e) => handleTextChange(['part4', 'task1'], e.target.value)}
            placeholder="Structurez votre plan d'exposé..."
          />
        </div>

        <div className="space-y-6 mt-12 border-t border-[#1A1A1A] pt-8">
          <h3 className="font-bold text-sm uppercase tracking-widest">Tâche 2: Entretien avec le jury</h3>
          {content.part4?.task2Questions?.map((q: string, i: number) => (
             <div key={i} className="space-y-3">
               <p className="font-bold text-sm">{q}</p>
               <textarea 
                  className="w-full p-3 bg-[#F9F7F2] border border-[#1A1A1A] text-sm font-serif focus:outline-none" rows={3}
                  onChange={(e) => handleTextChange(['part4', 'task2', i.toString()], e.target.value)}
                  placeholder="Ébauchez votre réponse argumentative..."
                />
             </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end p-4 mt-12">
         <Button size="lg" onClick={submitExam} isLoading={isSubmitting}>
           Soumettre l'Épreuve
         </Button>
      </div>

    </div>
  );
}
