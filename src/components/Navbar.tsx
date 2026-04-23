import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, logOut } from '../lib/firebase';
import { Button } from './ui/Button';
import { BookOpen } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="w-full border-b border-[#1A1A1A] flex items-center justify-between px-10 py-6 bg-[#FDFCF9]">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">Réussite Académique</span>
        <Link to="/" className="text-3xl font-serif italic tracking-tighter hover:opacity-80">
          Le DALF.ai
        </Link>
      </div>
      <div className="flex gap-8 text-xs uppercase tracking-widest font-semibold items-center">
        {user ? (
          <>
            <Link to="/dashboard" className="opacity-40 hover:opacity-100">
              Tableau de Bord
            </Link>
            <Button variant="outline" size="sm" onClick={logOut}>
              Déconnexion
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={signInWithGoogle}>
            Connexion Google
          </Button>
        )}
      </div>
    </nav>
  );
}
