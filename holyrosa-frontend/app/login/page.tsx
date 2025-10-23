// app/login/page.tsx - Login page using the reusable LoginForm component
import LoginForm from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 bg-cover bg-center"
      style={{
        backgroundImage: "url('/images/warehouse-pharmacy.jpg')"
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      <div className="max-w-md w-full space-y-8 p-8 relative z-10">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center">
            <img src="/logo.svg" alt="Holy Rosary Logo" className="mx-auto h-12 w-12 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your pharmacy account
            </p>
          </div>

          {/* Login Form Component */}
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
