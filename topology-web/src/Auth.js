import Amplify, { Auth } from 'aws-amplify';
import config from './config';

// ✅ 구버전용 Amplify 설정
Amplify.configure({
  Auth: {
    region: config.cognito.REGION,
    userPoolId: config.cognito.USER_POOL_ID,
    userPoolWebClientId: config.cognito.APP_CLIENT_ID,
  },
});

// 로그인
export const signIn = async (username, password) => {
  try {
    const user = await Auth.signIn(username, password);
    return user;
  } catch (error) {
    console.error('로그인 에러:', error);
    throw error;
  }
};

// 회원가입
export const signUp = async (username, password, email) => {
  try {
    const { user } = await Auth.signUp({
      username,
      password,
      attributes: {
        email,
      },
    });
    return user;
  } catch (error) {
    console.error('회원가입 에러:', error);
    throw error;
  }
};

// 로그아웃
export const signOut = async () => {
  try {
    await Auth.signOut();
  } catch (error) {
    console.error('로그아웃 에러:', error);
    throw error;
  }
};

// 현재 로그인된 사용자 가져오기
export const getCurrentUser = async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return user;
  } catch (error) {
    console.error('사용자 정보 가져오기 에러:', error);
    return null;
  }
};

// 인증 상태 확인
export const isAuthenticated = async () => {
  try {
    await Auth.currentAuthenticatedUser();
    return true;
  } catch {
    return false;
  }
};
