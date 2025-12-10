import { useAuth } from "../auth/AuthContext";

const AuthModal = () => {
  const { modalOpen, closeLogin, loginWithReddit, loading, error } = useAuth();

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-panel border border-border rounded-lg w-full max-w-md shadow-xl">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sign in</h2>
          <button className="text-secondary hover:text-neon" onClick={closeLogin} aria-label="Close">Close</button>
        </div>
        <div className="p-5 space-y-4">
          <button
            type="button"
            className="w-full bg-[#FF4500] text-white rounded-md py-2.5 font-medium hover:bg-[#e03d00] transition-colors flex items-center justify-center gap-2 shadow-sm"
            onClick={loginWithReddit}
            disabled={loading}
          >
            <span className="font-semibold">Sign in with Reddit</span>
          </button>
          {error && <div className="text-sm text-red-400 text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
