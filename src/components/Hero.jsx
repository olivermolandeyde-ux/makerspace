import HeroImage from '../assets/hero.jpg'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Hero() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, -350])

  return (
    <section className="relative h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: `url(${HeroImage})` }}>
      <div className="absolute inset-0 bg-black/50"></div>

      <motion.div style={{ y }} className="relative z-10 text-center text-white px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          Makerspace
        </h1>
        <p className="text-2xl md:text-4xl">
          Her skapes det greier
        </p>
      </motion.div>
    </section>
  )
}