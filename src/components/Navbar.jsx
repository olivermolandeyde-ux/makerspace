import MakerSpaceLogo from '../assets/makerspace.jpg';

export default function Navbar() {
  return (
    <nav className="bg-gray-200 p-3 shadow-sm">
      <img className="h-16 w-12" src={MakerSpaceLogo} alt="Makerspace logo" />
    </nav>
  );
}