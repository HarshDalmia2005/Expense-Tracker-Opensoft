import Layout from './Layout.jsx'
import { Routes, Route } from 'react-router-dom'
import SignUpPage from './components/Authentication/SignUpPage.jsx'
import SignInPage from './components/Authentication/SignInPage.jsx'
import { useAuth } from './components/Context/AuthContext.jsx'
import ProfileSetting2 from './components/profilepage/ProfileSetting2.jsx'
import InactiveAccount from './components/AuthRestrict/InactiveAccount.jsx'
import OauthSuccess from './components/Authentication/OauthSuccess.jsx'

const MainRouter = () => {
  const {isAuthenticated}=useAuth();
  return (
    <Routes>
      <Route path="*" element={isAuthenticated?<Layout />:<SignInPage/>} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/profile2" element={<ProfileSetting2 />} />
      <Route path='/inactive' element={<InactiveAccount/>} />
      <Route path="/oauth-success" element={<OauthSuccess />} />
    </Routes>
  )
}

export default MainRouter;
