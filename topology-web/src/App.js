import React, { useEffect, useState } from "react";
import { isAuthenticated, signOut } from "./Auth";
import Login from "./components/Login";

function App() {
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    const check = async () => {
      const ok = await isAuthenticated();
      setAuth(ok);
    };
    check();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setAuth(false);
  };

  return auth ? (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>로그인 성공!</h2>
      <button onClick={handleLogout}>로그아웃</button>
    </div>
  ) : (
    <Login setAuth={setAuth} />
  );
}

export default App;
