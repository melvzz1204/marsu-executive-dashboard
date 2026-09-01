import { useState, useEffect } from "react";
import api from "../api/axios";
import marsuLogo from "../assets/marsu-logo.png";

function LoginTransition({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    "Authenticating credentials...",
    "Establishing secure connection...",
    "Fetching institutional metrics...",
    "Compiling dashboard widgets...",
    "Access granted. Redirecting...",
  ];

  useEffect(() => {
    const duration = 2200; // 2.2 seconds total loading sequence
    const intervalTime = 40;
    const steps = duration / intervalTime;
    let currentStepCount = 0;

    const timer = setInterval(() => {
      currentStepCount++;
      const newProgress = Math.min((currentStepCount / steps) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 20) setCurrentStep(0);
      else if (newProgress < 45) setCurrentStep(1);
      else if (newProgress < 70) setCurrentStep(2);
      else if (newProgress < 95) setCurrentStep(3);
      else setCurrentStep(4);

      if (currentStepCount >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8fafc]/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-[#600018]/[0.03] blur-[120px]" />

      <div className="relative flex flex-col items-center max-w-sm w-full px-6">
        <div className="relative flex items-center justify-center w-14 h-14 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-2 border-t-[#600018] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
        </div>

        <div className="w-full text-center space-y-1 mb-6 h-12">
          <h3 className="text-xs font-bold tracking-widest text-[#600018] uppercase font-oswald">
            System Initialization
          </h3>
          <p className="text-[11px] text-slate-500 font-mono transition-all duration-200">
            {loadingSteps[currentStep]}
          </p>
        </div>

        <div className="w-full relative">
          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#600018] to-[#D4AF37] transition-all duration-75 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="absolute -bottom-5 right-0 text-[9px] font-mono font-bold text-slate-400">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
}

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic destination route tracking
  const [redirectPath, setRedirectPath] = useState("/dashboard");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      const data = response.data;

      if (data.success) {
        // 1. Store authentication token
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // 2. Extract and store user details & role
        const user = data.user || data.data?.user || {};
        const role = user.role || data.role;

        localStorage.setItem("user", JSON.stringify(user));

        // 3. Determine target route based on user role
        if (role === "information_unit") {
          setRedirectPath("/information-unit");
        } else if (role === "admin") {
          setRedirectPath("/admin-dashboard");
        } else if (role === "dean") {
          setRedirectPath("/dean-achievements");
        } else {
          setRedirectPath("/dashboard");
        }

        // 4. Trigger transition screen sequence
        setIsTransitioning(true);
      } else {
        setError(data.message || "Invalid email or password.");
      }
    } catch (err) {
      const connectionMessage =
        err.code === "ECONNABORTED"
          ? "The backend server is waking up. Please wait a moment and sign in again."
          : "Unable to reach the backend server. Check your internet connection and try again.";

      setError(err.response?.data?.message || connectionMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    // Navigates directly to calculated route (admin or standard)
    window.location.href = redirectPath;
  };

  return (
    <>
      {isTransitioning && (
        <LoginTransition onComplete={handleTransitionComplete} />
      )}

      <div className="mx-auto grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-2xl md:min-h-[620px] md:grid-cols-12 md:rounded-3xl">
        <div className="relative flex flex-col justify-between overflow-hidden border-b border-[#D4AF37]/20 bg-[#600018] p-5 text-white sm:p-8 md:col-span-5 md:border-b-0 md:border-r md:p-10">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl"></div>

          <div className="z-10 flex w-full justify-center">
            <div className="flex h-20 w-20 items-center justify-center sm:h-28 sm:w-28 md:h-38 md:w-38">
              <img
                src={marsuLogo}
                alt="MarSU Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="relative z-10 my-auto pt-4 sm:pt-8 md:pt-12 md:pb-8">
            <h3 className="max-w-sm text-xl font-black font-oswald tracking-tight uppercase leading-tight sm:text-2xl">
              Presidential Dashboard for Organizational Data and Insights
            </h3>
            <p className="hidden text-xs text-slate-300 mt-3 leading-relaxed max-w-xs font-light sm:block">
              Secure processing terminal engineered to evaluate state academic
              operations, tracking publication trends and systemic resource
              performance.
            </p>

            <div className="mt-6 hidden space-y-4 border-t border-white/10 pt-6 md:block">
              <div className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold text-sm mt-0.5">
                  ✓
                </span>
                <div>
                  <h4 className="text-xs font-bold font-oswald uppercase tracking-wide">
                    Academic Output & Analytics
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Evaluate systemic publication trends, research milestones,
                    and institutional performance metrics.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#D4AF37] font-bold text-sm mt-0.5">
                  ✓
                </span>
                <div>
                  <h4 className="text-xs font-bold font-oswald uppercase tracking-wide">
                    Research & Intellectual Capital
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Track systemic publication trends, research milestones, and
                    institutional output.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-5 hidden justify-between border-t border-white/5 pt-4 font-mono text-[10px] tracking-tighter text-slate-400 sm:flex md:mt-0">
            <span>SECURED CLOUD SERVER v2.6</span>
            <span className="text-[#D4AF37]/50">● ONLINE</span>
          </div>
        </div>

        <div className="relative flex flex-col justify-center bg-white p-5 sm:p-8 md:col-span-7 md:p-14">
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-oswald uppercase sm:text-3xl">
              Welcome Back
            </h2>
            <p className="mt-2 text-xs text-slate-500 tracking-wide font-medium">
              Access your executive performance command center
            </p>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-600 animate-in fade-in duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-8">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 font-oswald"
              >
                Email Address
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-[#600018] transition-colors duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@marsu.edu.ph"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-[#600018]/40 focus:bg-white focus:ring-4 focus:ring-[#600018]/[0.05]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-bold uppercase tracking-widest text-slate-600 font-oswald"
                >
                  Password
                </label>
                <a
                  href="#forgot"
                  className="text-xs font-semibold text-[#600018] hover:text-[#7a001e] hover:underline underline-offset-4 transition-all font-oswald"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-[#600018] transition-colors duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5m-2.851 0a7.486 7.486 0 015.855-1.158m7.135 0A7.488 7.488 0 0121.147 11.3c.09.431-.213.823-.652.823H3.504c-.439 0-.742-.392-.652-.823a7.47 7.47 0 013.434-4.274"
                    />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3.5 pl-11 pr-12 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 focus:border-[#600018]/40 focus:bg-white focus:ring-4 focus:ring-[#600018]/[0.05]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-slate-300 bg-white text-[#600018] focus:ring-0 accent-[#600018] cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-xs font-medium text-slate-500 select-none cursor-pointer hover:text-slate-700 transition-colors"
              >
                Remember this executive device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative mt-2 flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#D4AF37]/20 bg-[#660033] px-4 py-3.5 font-oswald text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all duration-200 hover:bg-[#7a001e] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>
                {isLoading ? "Validating Credentials..." : "Authorize Sign In"}
              </span>
            </button>
          </form>

          <div className="relative my-5 flex items-center justify-center sm:my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80"></div>
            </div>
            <span className="relative bg-white px-3 text-[9px] font-bold uppercase tracking-widest text-slate-400 font-oswald">
              Secured Matrix Node
            </span>
          </div>

          <p className="text-center text-xs text-slate-500">
            Need higher terminal clearance?{" "}
            <a
              href="#admin"
              className="font-semibold text-[#600018] hover:text-[#7a001e] hover:underline underline-offset-4 transition-all font-oswald uppercase text-[11px] tracking-wide"
            >
              Contact Admin
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
