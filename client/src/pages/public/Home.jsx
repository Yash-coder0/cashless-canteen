import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { menuAPI } from '../../api/axios'
import Navbar from '../../components/layouts/Navbar'
import Footer from '../../components/Footer'
import { UtensilsCrossed, ArrowRight, Star, ShoppingBag, Clock, HeartHandshake } from 'lucide-react'
export default function Home() {
  const [bestSellers, setBestSellers] = useState([])

  useEffect(() => {
    // Fetch bestsellers (limit to 4)
    menuAPI.getAll({ limit: 4, sort: 'popular' })
      .then(res => setBestSellers(res.data.data?.slice(0, 4) || []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-orange-50 py-20 lg:py-32 px-6">
          <div className="max-w-5xl mx-auto text-center animate-slide-up">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-600 text-xs font-bold tracking-wider uppercase mb-6">
              Welcome to RIT, Ishwarpur
            </span>
            <h1 className="font-display font-800 text-5xl lg:text-7xl text-gray-900 mb-6 leading-tight">
              Fuel your studies with <br className="hidden md:block" />
              <span className="text-brand-500">delicious food</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Skip the queue! Order your favorite meals, snacks, and beverages online from the official RIT Canteen and pick them up when ready.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg px-8 py-3 w-full sm:w-auto flex items-center justify-center gap-2">
                Order Now <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn-outline text-lg px-8 py-3 w-full sm:w-auto">
                View Menu
              </Link>
            </div>
          </div>
        </section>

        {/* Best Selling Items */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-700 text-3xl text-gray-900 mb-4">Best Selling Items</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Discover the most popular dishes loved by students across the campus.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.length > 0 ? bestSellers.map(item => (
              <div key={item._id} className="card overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-2 py-1 rounded">
                    ₹{item.price}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate mb-1">{item.name}</h3>
                  <div className="flex items-center text-xs text-gray-500 gap-3">
                    <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> {item.averageRating || '4.5'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {item.preparationTime} min</span>
                  </div>
                </div>
              </div>
            )) : (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton aspect-[4/3] w-full" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-20 px-6 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display font-700 text-3xl text-center text-gray-900 mb-12">What Students Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Rahul D.", text: "The wait times used to be crazy during breaks. Now I just order ahead and pick it up! Literal lifesaver.", stars: 5 },
                { name: "Sneha P.", text: "UI is super clean and payments are seamless. Also love the new menu additions they've been adding.", stars: 5 },
                { name: "Aditya M.", text: "Great experience overall. The food is always hot when I reach the counter because of the live order tracking.", stars: 4 }
              ].map((review, i) => (
                <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="flex text-amber-500 mb-4">
                    {[...Array(review.stars)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{review.text}"</p>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                      {review.name.charAt(0)}
                    </div>
                    {review.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-20 px-6 max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartHandshake size={32} />
          </div>
          <h2 className="font-display font-700 text-3xl text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Having trouble with your order or facing payment issues? Our support team is here to assist you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
              <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Email Support</span>
              <a href="mailto:support@ritcanteen.edu" className="font-medium text-gray-900 hover:text-brand-500">support@ritcanteen.edu</a>
            </div>
            <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100 w-full sm:w-auto">
              <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Call Desk</span>
              <span className="font-medium text-gray-900">+91 (123) 456-7890</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
