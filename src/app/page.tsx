"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Product } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservingProduct, setReservingProduct] = useState<string | null>(null);
  const [soldItems, setSoldItems] = useState<{[key: string]: number}>({});
  const router = useRouter();

  async function fetchProducts() {
    try {
      // Fetch products and sold statistics in parallel
      const [productsResponse, soldStatsResponse] = await Promise.all([
        axios.get("/api/products"),
        axios.get("/api/sold-stats")
      ]);
      
      setProducts(productsResponse.data);
      setSoldItems(soldStatsResponse.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    const interval = setInterval(() => {
      fetchProducts();
    }, 10000); // Update every 10 seconds to reduce database load
    return () => clearInterval(interval);
  }, []);

  async function reserveProduct(productId: string, warehouseId: string) {
    const reservationKey = `${productId}-${warehouseId}`;
    setReservingProduct(reservationKey);
    
    try {
      const response = await axios.post("/api/reservations", {
        productId,
        warehouseId,
        quantity: 1,
      });

      toast.success("Reservation created successfully!", {
        description: "Redirecting to checkout page...",
      });
      router.push(`/reservation/${response.data.id}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error("Not enough stock available", {
          description: "Please try a different warehouse or check back later.",
        });
      } else {
        toast.error(error.response?.data?.error || "Reservation failed");
      }
    } finally {
      setReservingProduct(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Skeleton */}
            <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-8 shadow-sm">
              <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-80 mb-4 animate-pulse shimmer"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-96 animate-pulse shimmer"></div>
            </div>
            
            {/* Cards Skeleton */}
            <div className="grid gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                  <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48 mb-6 animate-pulse shimmer"></div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="bg-gray-50 border border-gray-100 rounded-xl p-6">
                        <div className="flex justify-between items-center">
                          <div className="space-y-2">
                            <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse shimmer"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-24 animate-pulse shimmer"></div>
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-28 animate-pulse shimmer"></div>
                          </div>
                          <div className="h-12 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg w-32 animate-pulse shimmer"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white border border-gray-100 rounded-2xl p-12 max-w-md mx-auto shadow-sm">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products available</h3>
                <p className="text-gray-600">Check back later for inventory updates.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-8">
              {products.map((product) => {
                const totalAvailable = product.inventories.reduce((sum, inv) => sum + inv.availableUnits, 0);
                const totalReserved = product.inventories.reduce((sum, inv) => sum + inv.reservedUnits, 0);
                const totalSold = product.inventories.reduce((sum, inv) => {
                  const key = `${product.id}-${inv.warehouseId}`;
                  return sum + (soldItems[key] || 0);
                }, 0);
                const totalStock = product.inventories.reduce((sum, inv) => sum + inv.totalUnits, 0);

                return (
                  <div key={product.id} className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold text-white">
                            {product.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                            {product.name}
                          </h2>
                          <p className="text-gray-600">
                            Available across {product.inventories.length} warehouse{product.inventories.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                          <div className="text-sm text-green-600 mb-1 font-medium">Available</div>
                          <div className="text-2xl font-bold text-green-700">{totalAvailable}</div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                          <div className="text-sm text-yellow-600 mb-1 font-medium">Reserved</div>
                          <div className="text-2xl font-bold text-yellow-700">{totalReserved}</div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <div className="text-sm text-blue-600 mb-1 font-medium">Sold</div>
                          <div className="text-2xl font-bold text-blue-700">{totalSold}</div>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="text-sm text-gray-600 mb-1 font-medium">Total</div>
                          <div className="text-2xl font-bold text-gray-900">{totalStock}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      {product.inventories.map((inventory) => {
                        const reservationKey = `${product.id}-${inventory.warehouseId}`;
                        const isReserving = reservingProduct === reservationKey;
                        const isOutOfStock = inventory.availableUnits <= 0;
                        const soldCount = soldItems[reservationKey] || 0;
                        
                        return (
                          <div
                            key={inventory.inventoryId}
                            className={`bg-gray-50 border rounded-2xl p-6 transition-all duration-300 hover:shadow-md ${
                              isOutOfStock 
                                ? 'border-red-200 bg-red-50' 
                                : 'border-gray-200 hover:border-blue-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                      {inventory.warehouseName}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        isOutOfStock 
                                          ? 'bg-red-100 text-red-800' 
                                          : inventory.availableUnits <= 5
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {isOutOfStock ? 'Out of Stock' : inventory.availableUnits <= 5 ? 'Low Stock' : 'In Stock'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                  <div className="text-center">
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                      <span className="text-gray-500 block text-sm mb-1">Available</span>
                                      <span className="font-bold text-xl text-green-600">
                                        {inventory.availableUnits}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                      <span className="text-gray-500 block text-sm mb-1">Reserved</span>
                                      <span className="font-bold text-xl text-yellow-600">
                                        {inventory.reservedUnits}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                      <span className="text-gray-500 block text-sm mb-1">Sold</span>
                                      <span className="font-bold text-xl text-blue-600">
                                        {soldCount}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                                      <span className="text-gray-500 block text-sm mb-1">Total</span>
                                      <span className="font-bold text-xl text-gray-900">
                                        {inventory.totalUnits}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Enhanced Stock Level Bar */}
                                <div className="mb-4">
                                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                                    <span>Stock Distribution</span>
                                    <span>{Math.round((inventory.availableUnits / inventory.totalUnits) * 100)}% Available</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div className="h-full flex">
                                      {/* Available */}
                                      <div 
                                        className="bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                                        style={{ 
                                          width: `${(inventory.availableUnits / inventory.totalUnits) * 100}%` 
                                        }}
                                      ></div>
                                      {/* Reserved */}
                                      <div 
                                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                                        style={{ 
                                          width: `${(inventory.reservedUnits / inventory.totalUnits) * 100}%` 
                                        }}
                                      ></div>
                                      {/* Sold */}
                                      <div 
                                        className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
                                        style={{ 
                                          width: `${(soldCount / inventory.totalUnits) * 100}%` 
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span className="flex items-center">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                      Available
                                    </span>
                                    <span className="flex items-center">
                                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                                      Reserved
                                    </span>
                                    <span className="flex items-center">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                                      Sold
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="ml-8">
                                <button
                                  onClick={() => reserveProduct(product.id, inventory.warehouseId)}
                                  disabled={isOutOfStock || isReserving}
                                  className={`btn-glass min-w-[140px] ${
                                    isOutOfStock
                                      ? 'opacity-50 cursor-not-allowed'
                                      : isReserving
                                      ? 'cursor-wait'
                                      : 'hover:scale-105'
                                  }`}
                                >
                                  {isReserving ? (
                                    <div className="flex items-center justify-center space-x-2">
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>Reserving...</span>
                                    </div>
                                  ) : isOutOfStock ? (
                                    <div className="flex items-center justify-center space-x-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                      <span>Out of Stock</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                      <span>Reserve Now</span>
                                    </div>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}