import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getExams, getAttempts, createExam } from '../lib/db';
import { generateMockExam } from '../lib/genai';
import { Exam, Attempt, ExamContent } from '../types';
import { Button } from '../components/ui/Button';
import { FileText, Play, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([getExams(user.uid), getAttempts(user.uid)]).then(([e, a]) => {
        setExams(e);
        setAttempts(a);
        setLoading(false);
      });
    }
  }, [user]);

  const handleGenerateExam = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const content = await generateMockExam();
      const newExam = await createExam({
        userId: user.uid,
        content,
        createdAt: Date.now()
      });
      setExams([newExam, ...exams]);
    } catch (err) {
      console.error(err);
      alert("Failed to generate exam.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#1A1A1A] pb-6 mb-8 gap-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 block mb-2">Tableau de Bord</span>
          <h1 className="text-5xl font-serif italic tracking-tighter">Mes Épreuves</h1>
        </div>
        <Button onClick={handleGenerateExam} isLoading={isGenerating}>
          Générer Nouvel Examen
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="bg-[#F9F7F2] border border-[#1A1A1A] p-8 flex flex-col">
          <h2 className="text-xs uppercase tracking-widest font-bold mb-8 opacity-60">
            Examens Générés
          </h2>
          {exams.length === 0 ? (
            <div className="text-sm font-serif italic opacity-60">
              Aucun examen généré pour le moment.
            </div>
          ) : (
            <div className="space-y-8">
              {exams.map(exam => {
                let parsed: Partial<ExamContent> = {};
                try {
                  parsed = JSON.parse(exam.content);
                } catch(e) {}
                
                return (
                  <div key={exam.id} className="group flex flex-col gap-2">
                    <span className="block text-[10px] mb-1 font-mono uppercase opacity-50">
                      {new Date(exam.createdAt).toLocaleDateString()}
                    </span>
                    <h3 className="text-lg font-serif italic leading-tight">{parsed.title || 'Sans Titre'}</h3>
                    <p className="text-xs opacity-60 font-mono mb-4">Thème: {parsed.theme || 'Inconnu'}</p>
                    
                    <div className="mt-auto">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/exam/${exam.id}`)} className="w-full">
                        Passer l'Examen
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="p-8 border border-[#1A1A1A] flex flex-col">
           <h2 className="text-xs uppercase tracking-widest font-bold mb-8 opacity-60">
            Historique des Tentatives
          </h2>
          {attempts.length === 0 ? (
            <div className="text-sm font-serif italic opacity-60">
              Aucune épreuve complétée.
            </div>
          ) : (
            <div className="space-y-8">
              {attempts.map(attempt => {
                const isPassed = attempt.score !== undefined && attempt.score >= 50;
                return (
                  <div key={attempt.id} className="group cursor-pointer">
                    <span className="block text-[10px] mb-1 font-mono uppercase">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </span>
                    <h3 className="text-lg font-serif italic leading-tight">Tentative #{attempt.id.slice(0,4)}</h3>
                    <div className="flex items-end justify-between mt-4 pb-4 border-b border-[#1A1A1A] border-opacity-20">
                      <span className="text-3xl font-light">
                        {attempt.score !== undefined ? attempt.score : '--'}
                        <span className="text-sm">/100</span>
                      </span>
                      {attempt.score !== undefined ? (
                        <span className={`text-[10px] px-2 py-1 rounded-sm font-bold ${isPassed ? 'bg-[#1A1A1A] text-white' : 'bg-red-100 text-red-800'}`}>
                          {isPassed ? 'VALIDÉ' : 'À REVOIR'}
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase opacity-50">En évaluation...</span>
                      )}
                    </div>
                    <div className="mt-4">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/review/${attempt.id}`)} className="p-0 underline text-xs">
                        Voir les Corrections
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
