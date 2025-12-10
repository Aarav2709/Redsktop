import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import SubredditView from "./pages/SubredditView";
import PostView from "./pages/PostView";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { AuthProvider } from "./auth/AuthContext";

const App = () => {
  const [subreddit, setSubreddit] = useState("technology");
  const navigate = useNavigate();

  const onSubredditChange = (name: string) => {
    setSubreddit(name);
    navigate(`/r/${name}`);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-base text-white">
        <Header subreddit={subreddit} onChange={onSubredditChange} />
        <main className="flex-1 px-4 md:px-8 py-6">
          <Routes>
            <Route path="/r/:subreddit" element={<SubredditView />} />
            <Route path="/post/:id" element={<PostView />} />
            <Route path="*" element={<SubredditView />} />
          </Routes>
        </main>
        <Footer />
        <AuthModal />
      </div>
    </AuthProvider>
  );
};

export default App;
