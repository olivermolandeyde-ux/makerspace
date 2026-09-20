export default function ProductCard({ image, name, price, stock }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={image}
        alt={name}
        className="w-full h-48 object-cover"
      />

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{name}</h3>
        <p className="text-gray-600 mb-1">{price} kr</p>
        <p className="text-sm text-gray-500">{stock} igjen på lager</p>
      </div>
    </div>
  )
}