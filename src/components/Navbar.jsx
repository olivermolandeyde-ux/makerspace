import { useState } from 'react';
import MakerSpaceLogoen from '../assets/makerspace.jpg';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-[#ede8e8f2] p-1 shadow-sm flex items-center gap-4 relative">
      <img className="h-16 w-12" src={MakerSpaceLogoen} alt="Makerspace logo" />
      <a href="/" className="font-serif font-bold text-3xl text-gray-800">Makerspace</a>

      {/* pc menu */}
      <div className="hidden md:flex ml-auto font-extrabold gap-2">
        <link href="/" className="p-2 hover:text-yellow-600 duration-100">hjem</link>
        <link href="/about" className="p-2 hover:text-yellow-600 duration-100">Info</link>
        <link href="/products" className="p-2 hover:text-yellow-600 duration-100">Produkter</link>
        <link href="#" className="p-2 flex justify-center bg-yellow-500 w-40 rounded-4xl hover:bg-yellow-600 duration-100">Søknadskjema</link>
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
        <div className="md:hidden absolute top-full left-0 w-full bg-[#ede8e8f2] flex flex-col gap-1 pb-3 pt-2 text-xl font-extrabold">
          <link href="/" className="p-2 hover:text-yellow-600 duration-100">Hjem</link>
          <link href="/about" className="p-2 hover:text-yellow-600 duration-100">Info</link>
          <link href="/products" className="p-2 hover:text-yellow-600 duration-100">Produkter</link>
          <link href="#" className="p-3 flex justify-center bg-yellow-500 w-60 mx-auto rounded-4xl hover:bg-yellow-600 duration-100">Søknadskjema</link>
        </div>
      )}
    </nav>
  );
}