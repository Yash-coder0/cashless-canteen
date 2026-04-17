import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api, { menuAPI } from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, ShoppingBag, Plus } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cart, updateItem } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Form state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch product
      const resItem = await menuAPI.getById(id);
      setProduct(resItem.data.data);

      // Fetch reviews - using our new endpoints
      const resReviews = await api.get(`/reviews/${id}`);
      setReviews(resReviews.data.data || []);
    } catch (err) {
      toast.error('Failed to load product details.');
    } finally {
      setLoading(false);
    }
  };

  const cartItem = cart?.items?.find(
    (i) => i.menuItem?._id === id || i.menuItem === id
  );
  const qty = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (product?.isSoldOut) {
      toast.error('Item is sold out.');
      return;
    }
    try {
      await addToCart(id, 1);
      toast.success('Added to cart!', { icon: '🛒' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add to cart.');
    }
  };

  const handleOrderNow = async () => {
    if (qty === 0) {
      await handleAddToCart();
    }
    navigate('/cart');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating.');
      return;
    }
    
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        menuItemId: id,
        rating,
        comment
      });
      toast.success('Review submitted successfully!');
      setRating(0);
      setComment('');
      fetchData(); // reload reviews
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Product not found.</p>
        <button onClick={() => navigate('/menu')} className="mt-4 text-brand-500">← Back to Menu</button>
      </div>
    );
  }

  // Check if user has already reviewed
  const hasReviewed = reviews.some(r => r.userId?._id === user?._id || r.userId === user?._id);

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10 animate-fade-in">
      {/* a. BACK BUTTON */}
      <button 
        onClick={() => navigate('/menu')}
        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-brand-500 transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to Menu
      </button>

      {/* b. PRODUCT HERO SECTION */}
      <div className="card overflow-hidden mb-6">
        <div className="relative aspect-[4/3] bg-gray-100">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
          )}
          {product.isSoldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-sm font-bold px-4 py-1.5 rounded-full">SOLD OUT</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="font-display font-700 text-2xl text-gray-900">{product.name}</h1>
              {product.category?.name && (
                <span className="inline-block mt-1 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {product.category.name}
                </span>
              )}
            </div>
            <span className="font-display font-700 text-2xl text-gray-900">₹{product.price}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${product.isSoldOut ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {product.isSoldOut ? 'Sold Out' : 'Available'}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${product.isVegetarian ? 'border-emerald-600 bg-white' : 'border-red-600 bg-white'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? 'bg-emerald-600' : 'bg-red-600'}`} />
              </span>
              {product.isVegetarian ? 'Veg' : 'Non-Veg'}
            </span>
          </div>

          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {product.description || "No description available for this item."}
          </p>

          <div className="flex gap-3 mt-4">
            <button 
              onClick={handleAddToCart}
              disabled={product.isSoldOut}
              className="flex-1 btn-outline min-h-[48px] rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} /> Add to Cart {qty > 0 && `(${qty})`}
            </button>
            <button 
              onClick={handleOrderNow}
              disabled={product.isSoldOut}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 min-h-[48px]"
            >
              <ShoppingBag size={18} /> Order Now
            </button>
          </div>
        </div>
      </div>

      {/* c. RATINGS SUMMARY SECTION */}
      <div className="mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="text-center">
          <div className="font-display font-700 text-4xl text-gray-900">
            {product.avgRating ? product.avgRating.toFixed(1) : "0.0"}
          </div>
          <div className="text-xs text-gray-400 mt-1">{product.reviewCount || 0} reviews</div>
        </div>
        <div className="flex-1 h-12 flex items-center pl-4 border-l border-gray-100">
          <div className="flex gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={20} 
                fill={star <= Math.round(product.avgRating || 0) ? "currentColor" : "none"} 
                className={star <= Math.round(product.avgRating || 0) ? "text-amber-400" : "text-gray-200"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* d. REVIEWS LIST SECTION */}
      <h3 className="font-display font-700 text-lg text-gray-900 mb-3">Reviews</h3>
      <div className="space-y-3 mb-8">
        {reviews.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm text-gray-900">
                  {review.userId?.name?.split(' ')[0] || "Student"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="flex gap-0.5 text-amber-400 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={12} 
                    fill={star <= review.rating ? "currentColor" : "none"} 
                    className={star <= review.rating ? "text-amber-400" : "text-gray-200"}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* e. ADD REVIEW FORM */}
      {user && !hasReviewed && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Write a Review</h4>
          <form onSubmit={handleSubmitReview}>
            <div className="flex gap-2 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-95 hover:scale-110"
                >
                  <Star 
                    size={28} 
                    fill={star <= rating ? "currentColor" : "none"}
                    className={star <= rating ? "text-amber-400" : "text-gray-200"} 
                  />
                </button>
              ))}
            </div>
            
            <textarea
              className="w-full input text-sm mb-3 min-h-[100px] resize-none"
              placeholder="What did you like about this item?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
            />
            
            <button
              type="submit"
              disabled={submittingReview || rating === 0}
              className="w-full bg-brand-50 text-brand-600 hover:bg-brand-100 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
