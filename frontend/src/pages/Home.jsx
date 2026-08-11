import Login from "../components/Login";
import LoginBackground from "../components/LoginBackground";

function Home() {
  return (
    <div className="oswald-brand relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
      <LoginBackground />

      <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <Login />
      </div>
    </div>
  );
}

export default Home;
