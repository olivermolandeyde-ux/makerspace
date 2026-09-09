import { useState } from 'react';
import MakerSpaceLogo from '../assets/makerspace.jpg';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-[#ede8e8f2] p-1 shadow-sm flex items-center gap-4">
      <img className="h-16 w-12" src={MakerSpaceLogo} alt="Makerspace logo" />
      <h1 className="font-serif font-bold text-3xl text-gray-800">Makerspace</h1>

      {/* pc menu */}
      <div className="hidden md:flex">
        <a href="#" className="p-2">hjem</a>
        <a href="#" className="p-2">service</a>
        <a href="#" className="p-2">osv...</a>
      </div>

      {/* mobile menu button */}
      <button
        className="md:hidden p-2 text-2xl ml-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* mobilmeny */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#ede8e8f2] flex flex-col gap-2 pb-2">
          <a href="#" className="p-2">hjem</a>
          <a href="#" className="p-2">service</a>
          <a href="#" className="p-2">osv...</a>
        </div>
      )}
    </nav>
  );
}