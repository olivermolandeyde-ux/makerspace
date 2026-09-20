import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Openingstider from '../components/Openingstider'

export default function Home() {

  return (
    <>
      <div className="bg-gray-50"/>
      <div className="">
        <Navbar/>
        <Hero />
        <Openingstider />
      </div>
    </>
  )
}
