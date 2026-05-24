"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

interface ConfirmationData {
  reservation: {
    id: string;
    quantity: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    productId: string;
    warehouseId: string;
  };
  product: {
    id: string;
    name: string;
  };
  warehouse: {
    id: string;
    name: string;
  };
}

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfirmationData();
  }, []);

  async function fetchConfirmationData() {
    try {
      const response = await axios.get(`/api/confirmation/${params.id}`);
      setConfirmationData(response.data);
    } catch (error) {
      console.error("Failed to fetch confirmation data:", error);
      toast.error("Failed to load confirmation details");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  const downloadSlip = () => {
    if (!confirmationData) return;

    const { reservation, product, warehouse } = confirmationData;
    
    // Create HTML content for the slip
    const slipContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Confirmation - ${reservation.id}</title>
        <style>
          body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
          .slip { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
          .header p { margin: 5px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .success-badge { background: #dcfce7; color: #166534; padding: 12px 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; font-weight: 600; }
          .details { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
          .detail-row:last-child { margin-bottom: 0; border-bottom: none; }
          .label { font-weight: 600; color: #374151; }
          .value { color: #1f2937; }
          .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          .timestamp { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="slip">
          <div class="header">
            <h1>🎉 Purchase Confirmed!</h1>
            <p>Inventory Reserve Pro - Professional Management System</p>
          </div>
          <div class="content">
            <div class="success-badge">
              ✅ Your reservation has been successfully confirmed and processed
            </div>
            <div class="details">
              <div class="detail-row">
                <span class="label">Confirmation ID:</span>
                <span class="value">${reservation.id}</span>
              </div>
              <div class="detail-row">
                <span class="label">Product:</span>
                <span class="value">${product.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Warehouse:</span>
                <span class="value">${warehouse.name}</span>
              </div>
              <div class="detail-row">
                <span class="label">Quantity:</span>
                <span class="value">${reservation.quantity} unit${reservation.quantity > 1 ? 's' : ''}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">${reservation.status}</span>
              </div>
              <div class="detail-row">
                <span class="label">Reserved On:</span>
                <span class="value">${new Date(reservation.createdAt).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Confirmed On:</span>
                <span class="value">${new Date(reservation.updatedAt).toLocaleString()}</span>
              </div>
            </div>
            <div class="timestamp">
              Generated on ${new Date().toLocaleString()} | Inventory Reserve Pro
            </div>
          </div>
          <div class="footer">
            Thank you for using Inventory Reserve Pro!<br>
            For support, contact: support@inventoryreservepro.com
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([slipContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `confirmation-${reservation.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Confirmation slip downloaded successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Not Found</h2>
          <p className="text-gray-600 mb-6">The confirmation you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/")}
            className="btn-glass"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { reservation, product, warehouse } = confirmationData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 floating" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              🎉 Purchase Confirmed!
            </h1>
            <p className="text-lg text-gray-600">Your reservation has been successfully processed</p>
          </div>

          {/* Confirmation Card */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Status Banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-white text-lg">CONFIRMED</span>
                </div>
              </div>
            </div>

            {/* Confirmation Details */}
            <div className="p-8">
              <div className="grid gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Confirmation Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Confirmation ID</label>
                      <div className="bg-white rounded-lg p-3 font-mono text-sm text-gray-900 border border-gray-200">
                        {reservation.id}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Quantity</label>
                      <div className="bg-white rounded-lg p-3 text-gray-900 border border-gray-200">
                        <span className="text-xl font-bold text-green-600">{reservation.quantity}</span>
                        <span className="text-gray-600 ml-2">unit{reservation.quantity !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Product & Location
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Product</label>
                      <div className="bg-white rounded-lg p-3 text-gray-900 border border-gray-200 font-semibold">
                        {product.name}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Warehouse</label>
                      <div className="bg-white rounded-lg p-3 text-gray-900 border border-gray-200 font-semibold">
                        {warehouse.name}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Timeline
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Reserved On</label>
                      <div className="bg-white rounded-lg p-3 text-gray-900 border border-gray-200">
                        {new Date(reservation.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Confirmed On</label>
                      <div className="bg-white rounded-lg p-3 text-gray-900 border border-gray-200">
                        {new Date(reservation.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={downloadSlip}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Confirmation Slip</span>
                </button>

                <button
                  onClick={() => router.push("/")}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Back to Home</span>
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Important Information:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• Your purchase has been confirmed and processed successfully</li>
                      <li>• The confirmation slip contains all transaction details</li>
                      <li>• Keep this confirmation for your records</li>
                      <li>• For support, contact: support@inventoryreservepro.com</li>
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