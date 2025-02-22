export default function AuthLayout({children}: {children: React.ReactNode}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Main Content */}
            <div className="w-full md:w-1/2">
                {children}
            </div>

            {/* Gradient/Testimonial Section */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-purple-600 to-red-500 p-8 md:p-12 flex items-center justify-center min-h-[300px] md:min-h-0">
                <div className="text-white max-w-lg">
                    <div className="text-2xl md:text-3xl font-bold mb-6">
                        "RadarRules has transformed how we handle compliance. It's now a seamless part of our daily operations."
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/20" />
                        <div>
                            <div className="font-medium">@SarahSmith</div>
                            <div className="text-sm opacity-80">CTO of SecureFlow</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
