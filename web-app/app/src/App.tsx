import { ChakraProvider, theme } from '@chakra-ui/react';
import Navbar from './components/nav/navbar';
import Settings from './components/settings/settings';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Amplify from 'aws-amplify';
import Device from './components/device/device';
import Home from './components/home/home';
import Activity from './components/activity/activity';
import Body from './components/body/body';
import Biometrics from './components/biometrics/biometrics';
import Nutrition from './components/nutrition/nutrition';
import Sleep from './components/sleep/sleep';
import User from './components/user/user';

Amplify.configure({
  Auth: {
    userPoolId: process.env.REACT_APP_USER_POOL_ID,
    region: process.env.REACT_APP_AWS_REGION,
    userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
  }
});

export const App = () => (
  <Authenticator loginMechanisms={['email']}>
    {({ signOut, user }) => {
      return (
        <main>
          <BrowserRouter>
            <ChakraProvider theme={theme}>
              <Navbar
                children={
                  <Routes>
                    <Route path='/' element={<Home></Home>} />
                    <Route path='device' element={<Device></Device>} />
                    <Route path='settings' element={<Settings></Settings>} />
                    <Route path='activity' element={<Activity></Activity>} />
                    <Route path='body' element={<Body></Body>} />
                    <Route
                      path='biometrics'
                      element={<Biometrics></Biometrics>}
                    />
                    <Route path='nutrition' element={<Nutrition></Nutrition>} />
                    <Route path='sleep' element={<Sleep></Sleep>} />
                    <Route path='user' element={<User></User>} />
                  </Routes>
                }
                signOut={signOut}
                user={user}
              />
            </ChakraProvider>
          </BrowserRouter>
        </main>
      );
    }}
  </Authenticator>
);
