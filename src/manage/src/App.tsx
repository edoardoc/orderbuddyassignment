import { Redirect, Route, Switch } from 'react-router-dom';
import {
  IonApp,
  IonContent,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonSpinner,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact,
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
// import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import './theme/variables.css';
import { Suspense, useEffect, useState } from 'react';
import PWAPrompt from 'react-ios-pwa-prompt';
import PWAInstallPrompt from './pwa';
import DashboardPage from './pages/dashboard-page/DashboardPage';
import React from 'react';

// import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
// import Passwordless from "supertokens-auth-react/recipe/passwordless";
// import Session, { SessionAuth } from "supertokens-auth-react/recipe/session";
// import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
// import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import * as reactRouterDom from 'react-router-dom';
import RootPage from './root';

//custom imports for supertokens-ui
import SuperTokens from 'supertokens-web-js';
import Session from 'supertokens-web-js/recipe/session';
import Passwordless from 'supertokens-web-js/recipe/passwordless';
import LoginPage from './pages/login/login';
import { checkSessionStatus } from './pages/checksession';
import StationsPage from './pages/stations/stations';
import IndividualStationPage from './pages/stations/individual-station/station';
import RestaurantsPage from './pages/restaurants-page/RestaurantsPage';
import LocationsPage from './pages/location-page/LocationsPage';
import OriginsPage from './pages/origin-page/OriginPage';
import { MenuListPage } from './pages/menu-page/MenuListPage';
import { MenuCategoriesPage } from './pages/menu-page/MenuCategoryPage';
import { MenuItemsPage } from './pages/menu-page/MenuItemsPage';
import { ManageMenuItem } from './pages/menu-page/ManageMenuItem';
import LaunchPadPage from './pages/launch-pad/LaunchPadPage';
setupIonicReact();
const apiEndPoint = import.meta.env.VITE_API_ENDPOINT as string;

SuperTokens.init({
  appInfo: {
    apiDomain: apiEndPoint,
    apiBasePath: '/login',
    appName: 'OrderBuddy',
  },
  recipeList: [Session.init(), Passwordless.init({})],
});
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      const hasSession = await checkSessionStatus();
      setIsAuthenticated(hasSession);
    };

    verifySession();
  }, []);

  if (isAuthenticated === null) {
    return (
      <IonApp>
        <IonContent className='ion-padding ion-text-center'>
          <IonSpinner />
        </IonContent>
      </IonApp>
    );
  }

  return (
    <IonApp style={{ userSelect: 'none' }}>
      <Suspense fallback={<IonSpinner />}>
        <IonReactRouter>
          <IonRouterOutlet>
            <Switch>
              {/* Login route - only accessible when logged out */}
              {/* //todo refactor */}
              <Route
                exact
                path='/login'
                render={() => (isAuthenticated ? <Redirect to='/root-page' /> : <LoginPage />)}
              />

              {/* Protected routes */}
              <Route
                path='/:restaurantId/:locationId/launch-pad'
                render={(props) => (isAuthenticated ? <LaunchPadPage /> : <Redirect to='/login' />)}
              />

              <Route
                path='/:restaurantId/:locationId/apps/orders'
                render={(props) => (isAuthenticated ? <DashboardPage /> : <Redirect to='/login' />)}
              />

              <Route
                path='/restaurants'
                render={(props) => (isAuthenticated ? <RestaurantsPage /> : <Redirect to='/login' />)}
              />
              <Route
                path='/:restaurantId/locations'
                render={(props) => {
                  return isAuthenticated ? <LocationsPage /> : <Redirect to='/login' />;
                }}
              />
              <Route
                path='/:restaurantId/:locationId/apps/kds'
                render={(props) => (isAuthenticated ? <StationsPage /> : <Redirect to='/login' />)}
              />
              <Route
                path='/:restaurantId/:locationId/apps/menu/list'
                render={(props) => (isAuthenticated ? <MenuListPage /> : <Redirect to='/login' />)}
              />

              <Route
                path='/:restaurantId/:locationId/apps/menu/:menuId/categories'
                render={(props) => (isAuthenticated ? <MenuCategoriesPage /> : <Redirect to='/login' />)}
              />
              <Route
                path='/:restaurantId/:locationId/apps/menu/:menuId/:categoryId/items/:itemId'
                render={(props) => (isAuthenticated ? <ManageMenuItem /> : <Redirect to='/login' />)}
              />
              <Route
                path='/:restaurantId/:locationId/apps/menu/:menuId/:categoryId/items'
                render={(props) => (isAuthenticated ? <MenuItemsPage /> : <Redirect to='/login' />)}
              />

              <Route
                path='/root-page'
                render={(props) => (isAuthenticated ? <RootPage /> : <Redirect to='/login' />)}
              />

              <Route
                exact
                path='/:restaurantId/:locationId/apps/station/:stationId'
                component={IndividualStationPage}
              />

              <Route
                path='/:restaurantId/:locationId/apps/origins'
                render={(props) => (isAuthenticated ? <OriginsPage /> : <Redirect to='/login' />)}
              />

              <Route render={() => <Redirect to={isAuthenticated ? '/root-page' : '/login'} />} />
            </Switch>
          </IonRouterOutlet>
        </IonReactRouter>
      </Suspense>
      <PWAInstallPrompt />
      <PWAPrompt />
    </IonApp>
  );
};
export default App;
