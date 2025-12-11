import { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import SubredditView from "./pages/SubredditView";
import PostView from "./pages/PostView";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";

const App = () => {
  const [subreddit, setSubreddit] = useState("all");
  const navigate = useNavigate();

  const onSubredditChange = (name: string) => {
    setSubreddit(name);
    navigate(`/r/${name}`);
  };

  return (
    <div className="min-h-screen bg-base text-white">
      <div className="min-h-screen flex flex-col">
        <Header subreddit={subreddit} onChange={onSubredditChange} />

        <main className="flex-1 px-4 md:px-8 py-8">
          <div className="max-w-6xl mx-auto w-full space-y-6">
            <Routes>
              <Route path="/r/:subreddit" element={<SubredditView />} />
              <Route path="/post/:id" element={<PostView />} />
              <Route path="*" element={<SubredditView />} />
            </Routes>
          </div>
        </main>

        <Footer />
        <AuthModal />
      </div>
    </div>
  );
};

export default App;
