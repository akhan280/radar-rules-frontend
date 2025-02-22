export default function CheckEmailPage() {
  return (
    <div className="p-4 md:p-8 flex flex-col justify-center items-center min-h-screen">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent you a magic link to your email address. Click the link to sign in to your account.
          </p>
        </div>
        <div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Didn't receive an email?
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Check your spam folder or try signing in again.
          </p>
        </div>
      </div>
    </div>
  );
} 