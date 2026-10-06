import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';

export const CheckoutStatusPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const status = params.get('status') || 'success';
  const paymentId = params.get('payment_id');
  const orderId = params.get('razorpay_order_id');
  const signature = params.get('razorpay_signature');
  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          {isSuccess ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <XCircle className="h-10 w-10" />
            </div>
          )}
        </div>

        <h1 className="text-center text-3xl font-bold text-slate-900">
          {isSuccess ? 'Payment Successful' : 'Payment Cancelled'}
        </h1>

        <p className="mt-4 text-center text-slate-600">
          {isSuccess
            ? 'Your Pro subscription is active. You can continue to your dashboard and start practicing right away.'
            : 'Your checkout was cancelled. No charge was made and you can try again anytime.'}
        </p>

        {isSuccess && (paymentId || orderId || signature) && (
          <div className="mt-5 rounded-lg bg-slate-100 p-4 text-left text-sm text-slate-700">
            <p><span className="font-semibold">Payment ID:</span> {paymentId || 'N/A'}</p>
            <p><span className="font-semibold">Order ID:</span> {orderId || 'N/A'}</p>
            <p><span className="font-semibold">Signature:</span> {signature ? 'Verified' : 'N/A'}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={isSuccess ? '/dashboard' : '/pricing'}
            className="rounded-lg bg-indigo-600 px-5 py-3 text-center font-medium text-white transition hover:bg-indigo-500"
          >
            {isSuccess ? 'Go to Dashboard' : 'Back to Pricing'}
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-slate-300 px-5 py-3 text-center font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};
