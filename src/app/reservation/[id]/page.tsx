"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Reservation {
  id: string;
  status: string;
  quantity: number;
  expiresAt: string;
  productId: string;
  warehouseId: string;
}

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchReservation() {
    try {
      const response = await axios.get(`/api/reservations/${params.id}`);
      setReservation(response.data);
    } catch {
      toast.error("Failed to fetch reservation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReservation();
  }, []);

  useEffect(() => {
    if (!reservation) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(reservation.expiresAt).getTime();
      const distance = expiry - now;

      if (distance <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(distance / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  async function confirmReservation() {
    setIsProcessing(true);
    try {
      await axios.post(`/api/reservations/${params.id}/confirm`);
      toast.success("Purchase confirmed successfully!", {
        description: "Redirecting to confirmation page...",
      });
      // Redirect to confirmation page instead of home
      router.push(`/confirmation/${params.id}`);
    } catch (error: any) {
      if (error.response?.status === 410) {
        toast.error("Reservation has expired", {
          description: "Please create a new reservation.",
        });
        setIsExpired(true);
      } else {
        toast.error("Confirmation failed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  async function releaseReservation() {
    setIsProcessing(true);
    try {
      await axios.post(`/api/reservations/${params.id}/release`);
      toast.success("Reservation cancelled successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Cancellation failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
            <div className="flex space-x-4 mt-8">
              <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
              <div className="h-12 bg-gray-200 rounded-lg flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservation Not Found</h2>
          <p className="text-gray-600 mb-6">The reservation you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RELEASED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'CONFIRMED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'RELEASED':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reservation Checkout</h1>
                <p className="text-gray-600">Complete your reservation or make changes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Status Banner */}
            <div className={`px-8 py-6 border-b border-gray-200 ${
              isExpired ? 'bg-red-50' : reservation.status === 'CONFIRMED' ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(reservation.status)}`}>
                    {getStatusIcon(reservation.status)}
                    <span className="font-medium text-sm">
                      {reservation.status === 'PENDING' && isExpired ? 'EXPIRED' : reservation.status}
                    </span>
                  </div>
                </div>
                {reservation.status === 'PENDING' && !isExpired && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
                    <div className={`text-2xl font-bold ${
                      timeLeft.includes('0m') ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {timeLeft}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reservation Details */}
            <div className="p-8">
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Reservation ID</label>
                    <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-900 border">
                      {reservation.id}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-2">Quantity</label>
                    <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border">
                      <span className="text-2xl font-bold">{reservation.quantity}</span>
                      <span className="text-gray-600 ml-2">unit{reservation.quantity !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Product ID</label>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-900 border">
                    {reservation.productId}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Warehouse ID</label>
                  <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-900 border">
                    {reservation.warehouseId}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-2">Expires At</label>
                  <div className="bg-gray-50 rounded-lg p-3 text-gray-900 border">
                    {new Date(reservation.expiresAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {reservation.status === 'PENDING' && !isExpired && (
                <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={confirmReservation}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Confirm Purchase</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={releaseReservation}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel Reservation</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {(reservation.status !== 'PENDING' || isExpired) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => router.push("/")}
                    className="w-full btn-secondary py-4 text-lg"
                  >
                    Back to Inventory
                  </button>
                </div>
              )}

              {/* Help Text */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Information:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Reservations expire automatically after 10 minutes</li>
                      <li>• Confirmed purchases cannot be cancelled</li>
                      <li>• Released reservations return stock to inventory</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}