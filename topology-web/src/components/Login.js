import React, { useState } from "react";
import { signIn } from "../Auth";

function Login({ setAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn(username, password);
      setAuth(true);
    } catch {
      setError("로그인 실패: 아이디 또는 비밀번호 확인!");
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "100px auto", textAlign: "center" }}>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", margin: "8px 0" }}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "10px", margin: "8px 0" }}
        />
        <button type="submit" style={{ padding: "10px", width: "100%" }}>
          로그인
        </button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Login;