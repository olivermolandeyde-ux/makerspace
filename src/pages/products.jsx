import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import product1 from '../assets/product1.jpg'
import product2 from '../assets/product2.jpg'
import product3 from '../assets/product3.jpg'
import product4 from '../assets/product4.jpg'
import product5 from '../assets/product5.jpg'

const products = [
  { id: 1, name: "Spiss figur med bein", price: 70, image: product1, stock: 7 },
  { id: 2, name: "Tabubu", price: 150, image: product2, stock: 14 },
  { id: 3, name: "Fidget cube", price: 60, image: product3, stock: 4},
  { id: 4, name: "Mini Fidget Cube", price: 30, image: product4, stock: 37},
  { id: 5, name: "Nissetag", price: 20, image: product5, stock: 12},
]
export default function Products() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Produkter</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
              stock={product.stock}
            />
          ))}
        </div>
      </div>
    </div>
  )
}