'use client';

import Link from 'next/link';
import Image from 'next/image';
import logoImg from '../../assets/f90b53223fdaa6590fb74226dca7ff83be56c9f0.png';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center p-3 mx-auto mb-4">
            <Image
              src={logoImg}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">
            Password reset is managed through Keycloak
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to reset your password:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Go to the login page</li>
              <li>Click "Sign In with Keycloak"</li>
              <li>On the Keycloak login page, click "Forgot Password?"</li>
              <li>Follow the instructions to reset your password</li>
            </ol>
          </div>

          <Link
            href="/login"
            className="block w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-center shadow-lg hover:shadow-xl"
          >
            Go to Login
          </Link>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a href="mailto:support@insa.gov.et" className="text-blue-600 font-semibold hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>System Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
