import MakerSpaceLogoen from '../assets/makerspace.jpg';

const apningstider = [
  { dag: "Mandag", tid: "Lukket" },
  { dag: "Tirsdag", tid: "Lukket" },
  { dag: "Onsdag", tid: "Lukket" },
  { dag: "Torsdag", tid: "08:00 - 09:30" },
  { dag: "Fredag", tid: "12:00 - 14:20" },
  { dag: "Lørdag", tid: "Lukket" },
  { dag: "Søndag", tid: "Lukket" },
];

export default function Openingstider() {
  return (
    <div className="bg-gray-900 flex flex-col items-center gap-6 p-6 pt-40 pb-24">
      <img className="h-32 w-24" src={MakerSpaceLogoen} alt="Makerspace logo" />

      <h2 className="text-white font-bold text-3xl tracking-wide">Åpningstider</h2>

      <div className="w-full max-w-xs border-t border-gray-700"></div>

      <ul className="w-full max-w-xs flex flex-col gap-2">
        {apningstider.map(({ dag, tid }) => (
          <li
            key={dag}
            className={`flex justify-between text-lg ${
              tid === "Lukket" ? "text-gray-500" : "text-white font-semibold"
            }`}
          >
            <span>{dag}</span>
            <span>{tid}</span>
          </li>
        ))}
      </ul>

      <div className="w-full max-w-xs border-t border-gray-700"></div>
    </div>
  );
}