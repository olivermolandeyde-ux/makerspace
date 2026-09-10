import HeroImage from '../assets/hero.jpg'

export default function Hero() {
  return (
    <section className="relative h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${HeroImage})` }}>
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 text-center text-white px-4"> 
        <h1 className="text-7xl md:text-6x1 font-bold mb-4">
          Makerspace
        </h1>
        <p className="text-4xl md:text-2xl">
          Her skapes det greier
        </p>
      </div>
    </section>
  )
}