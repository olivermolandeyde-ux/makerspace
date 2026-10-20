import { useState } from 'react';
import MakerSpaceLogoen from '../assets/makerspace.jpg';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="no-print z-50 bg-navbar p-1 shadow-sm flex items-center gap-4 relative">
      <img className="h-16 w-12" src={MakerSpaceLogoen} alt="Makerspace logo" />
      <a href="/" className="font-serif font-bold text-3xl text-ink">Makerspace</a>

      {/* pc menu */}
      <div className="hidden md:flex ml-auto font-extrabold gap-2 items-center">
        <Link to="/" className="p-2 hover:text-brand-600 duration-100">hjem</Link>
        <Link to="/about" className="p-2 hover:text-brand-600 duration-100">Info</Link>
        <Link to="/products" className="p-2 hover:text-brand-600 duration-100">Produkter</Link>
        <Link to="/registrer" className="p-2 flex justify-center bg-brand-500 w-48 whitespace-nowrap rounded-4xl hover:bg-brand-600 duration-100">Registrer forbruk</Link>
        <Link to="/admin" className="px-2 py-2 text-xs font-medium text-muted hover:text-brand-600 duration-100">Admin</Link>
      </div>

      {/* mobile menu button */}
      <button
        className="md:hidden p-2 text-2xl ml-auto"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Lukk menyen' : 'Åpne menyen'}
        aria-expanded={isOpen}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* mobilmeny */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-navbar flex flex-col gap-1 pb-3 pt-2 text-xl font-extrabold shadow-sm">
          <Link to="/" className="p-2 hover:text-brand-600 duration-100">Hjem</Link>
          <Link to="/about" className="p-2 hover:text-brand-600 duration-100">Info</Link>
          <Link to="/products" className="p-2 hover:text-brand-600 duration-100">Produkter</Link>
          <Link to="/registrer" className="p-3 flex justify-center bg-brand-500 w-60 mx-auto rounded-4xl hover:bg-brand-600 duration-100">Registrer forbruk</Link>
          <Link to="/admin" className="px-2 py-1 text-center text-sm font-medium text-muted hover:text-brand-600 duration-100">Admin</Link>
        </div>
      )}
    </nav>
  );
}
