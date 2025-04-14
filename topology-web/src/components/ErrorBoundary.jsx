// ErrorBoundary.jsx
import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // 자식 컴포넌트에서 에러 발생 시 상태 갱신
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // 실제 에러 로그 처리
  componentDidCatch(error, info) {
    // xterm.js 'dimensions' 오류도 여기서 한 번에 처리
    console.warn("[ErrorBoundary] 무시된 오류:", error.message);
  }

  render() {
    if (this.state.hasError) {
      // 에러 발생 시 표시할 UI (null = 아무것도 안보이게)
      return null;
    }
    // 정상 시 자식 컴포넌트 렌더링
    return this.props.children;
  }
}
