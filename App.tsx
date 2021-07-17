import { NavigationContainer, NavigationProp, ParamListBase } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { EventType, ToggleProfileManagerEvent, User, ToggleActionSheetEvent, } from './src/types';
import { settingsGlobals } from './src/globals/settingsGlobals';
import { updateThemeStyles } from './styles/globalColors';
import { globals } from './src/globals/globals';
import { constants } from './src/globals/constants';
import { SnackbarComponent } from './src/components/snackbarComponent';
import { cache, initCache } from './src/services/dataCaching/cache';
import { notificationsService } from './src/services/notificationsService';
import { LoginNavigator } from './src/navigation/loginNavigator';
import { ActionSheet } from './src/components/actionSheet.component';
import { DiamondAnimationComponent } from '@components/diamondAnimation.component';
import { cloutFeedApi } from '@services';
import { enableScreens } from 'react-native-screens';
import { signing } from '@services/authorization/signing';
import { authentication } from '@services/authorization/authentication';
import { ProfileManagerComponent } from '@components/profileManager.component';
import { eventManager, hapticsManager } from '@globals/injector';
import { StatusBar } from 'expo-status-bar';
import { TabNavigator } from './src/navigation/tabNavigator';
import MessageStackScreen from './src/navigation/messageStackNavigator';
import { ActionSheetConfig } from '@services/actionSheet';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { stackConfig } from './src/navigation/stackNavigationConfig';
import CloutFeedIntroduction from '@screens/introduction/cloutFeedIntroduction.screen';
import TermsConditionsScreen from '@screens/login/termsAndConditions.screen';
enableScreens();

const Stack = createStackNavigator();

export default function App(): JSX.Element {
  const [isLoading, setLoading] = useState(true);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [areTermsAccepted, setTermsAccepted] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [actionSheetConfig, setActionSheetConfig] = useState<ActionSheetConfig>();
  const [navigation, setNavigation] = useState<NavigationProp<ParamListBase>>();

  let mount = true;

  useEffect(
    () => {
      const unsubscribeProfileManager = eventManager.addEventListener(
        EventType.ToggleProfileManager,
        (event: ToggleProfileManagerEvent) => {
          if (mount) {
            setShowProfileManager(event.visible);
            setNavigation(event.navigation);
          }
        }
      );
      const unsubscribeActionSheet = eventManager.addEventListener(
        EventType.ToggleActionSheet,
        (event: ToggleActionSheetEvent) => {
          if (mount) {
            setActionSheetConfig(event.config);
            setShowActionSheet(event.visible);
          }
        }
      );

      checkAuthenticatedUser().then(() => undefined).catch(() => undefined);

      return () => {
        unsubscribeProfileManager();
        unsubscribeActionSheet();
        mount = false;
      };
    },
    []
  );

  async function checkAuthenticatedUser() {
    try {
      const publicKey = await SecureStore.getItemAsync(constants.localStorage_publicKey);
      if (publicKey) {
        const cloutFeedIdentity = await SecureStore.getItemAsync(constants.localStorage_cloutFeedIdentity);

        if (cloutFeedIdentity) {
          globals.user.publicKey = publicKey;
          await setTheme(true);

          const readonlyValue = await SecureStore.getItemAsync(constants.localStorage_readonly);
          globals.readonly = readonlyValue !== 'false';
          globals.onLoginSuccess();
        } else {
          await SecureStore.deleteItemAsync(constants.localStorage_publicKey);
          await SecureStore.deleteItemAsync(constants.localStorage_readonly);

          if (mount) {
            setTermsAccepted(true);
            setLoading(false);
          }
        }
      } else {
        const termsAccepted = await SecureStore.getItemAsync(constants.localStorage_termsAccepted);

        if (mount) {
          setTermsAccepted(termsAccepted === 'true');
          setLoading(false);
        }
      }
    } catch {
      return;
    }
  }

  globals.acceptTermsAndConditions = () => {
    if (mount) {
      setTermsAccepted(true);
    }
  };

  globals.onLoginSuccess = () => {
    cache.user.reset();
    if (mount) {
      setLoading(true);
    }
    initCache();

    Promise.all(
      [
        cache.user.getData(),
        cache.savedPosts.reloadData()
      ]
    ).then(
      async p_responses => {
        setInvestorFeatures(p_responses[0]);
        setFollowerFeatures(p_responses[0]);

        globals.user.username = p_responses[0].ProfileEntryResponse?.Username;

        if (globals.readonly === false) {
          notificationsService.registerPushToken().catch(() => undefined);
        }
        await setTheme();
        await hapticsManager.init();
      }
    ).catch(() => undefined).finally(
      () => {
        if (mount) {
          setLoggedIn(true);
          setTermsAccepted(true);
          setLoading(false);
        }
      }
    );
  };

  globals.onLogout = async () => {
    if (mount) {
      setLoading(true);
    }
    await SecureStore.deleteItemAsync(constants.localStorage_publicKey);
    await SecureStore.deleteItemAsync(constants.localStorage_readonly);

    if (globals.readonly === false) {
      const jwt = await signing.signJWT();
      cloutFeedApi.unregisterNotificationsPushToken(globals.user.publicKey, jwt).catch(() => undefined);
      await authentication.removeAuthenticatedUser(globals.user.publicKey);

      const loggedInPublicKeys = await authentication.getAuthenticatedUserPublicKeys();

      if (loggedInPublicKeys?.length > 0) {
        const publicKey = loggedInPublicKeys[0];
        await SecureStore.setItemAsync(constants.localStorage_publicKey, publicKey);
        await SecureStore.setItemAsync(constants.localStorage_readonly, 'false');
        globals.user = { publicKey, username: '' };
        globals.readonly = false;
        globals.onLoginSuccess();
        return;
      }
    }

    globals.user.publicKey = '';
    globals.investorFeatures = false;
    globals.followerFeatures = false;
    globals.readonly = true;

    if (mount) {
      setLoggedIn(false);
      setTermsAccepted(true);
      setLoading(false);
    }
    cache.user.reset();
  };

  function setInvestorFeatures(p_user: User) {
    globals.investorFeatures = true;

    const usersYouHODL = p_user.UsersYouHODL;

    const cloutFeedCoin = usersYouHODL?.find(p_user => p_user.CreatorPublicKeyBase58Check === constants.cloutfeed_publicKey);

    if ((cloutFeedCoin && cloutFeedCoin.BalanceNanos > 30000000) || p_user.PublicKeyBase58Check === constants.cloutfeed_publicKey) {
      globals.investorFeatures = true;
    }
  }

  function setFollowerFeatures(p_user: User) {
    globals.followerFeatures = globals.user.publicKey === constants.cloutfeed_publicKey;

    const followedByUserPublicKeys = p_user.PublicKeysBase58CheckFollowedByUser;

    if (followedByUserPublicKeys?.length > 0 && followedByUserPublicKeys.indexOf(constants.cloutfeed_publicKey) !== -1) {
      globals.followerFeatures = true;
    }
  }

  async function setTheme(p_force = false) {
    settingsGlobals.darkMode = false;

    const key = globals.user.publicKey + constants.localStorage_appearance;
    if (globals.followerFeatures || p_force) {
      const theme = await SecureStore.getItemAsync(key);
      settingsGlobals.darkMode = theme === 'dark';
    } else {
      await SecureStore.setItemAsync(key, 'light');
    }

    updateThemeStyles();
  }

  return isLoading ?
    <CloutFeedLoader />
    :
    <NavigationContainer>
      <StatusBar style={settingsGlobals.darkMode ? 'light' : 'dark'} hidden={false} />
      <Stack.Navigator
        screenOptions={stackConfig}>
        {
          !isLoggedIn ?
            areTermsAccepted ?
              <Stack.Screen
                options={{
                  headerShown: false,
                }}
                name="LoginNavigator" component={LoginNavigator} />
              :
              <>
                <Stack.Screen options={{
                  headerStyle: { elevation: 0, shadowRadius: 0, shadowOffset: { height: 0, width: 0 } },
                  headerTitleStyle: { alignSelf: 'center', fontSize: 20 }
                }} name="Introduction" component={CloutFeedIntroduction} />
                <Stack.Screen options={{ headerShown: false }} name="TermsConditions" component={TermsConditionsScreen} />
              </>
            :
            <React.Fragment>
              <Stack.Screen
                name="TabNavigator"
                component={TabNavigator}
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="MessageStack"
                component={MessageStackScreen}
                options={{
                  headerShown: false,
                }}
              />
            </React.Fragment>
        }
      </Stack.Navigator >
      <DiamondAnimationComponent />
      {showActionSheet && actionSheetConfig && <ActionSheet config={actionSheetConfig} />}
      <SnackbarComponent />
      {
        showProfileManager ?
          <ProfileManagerComponent navigation={navigation as NavigationProp<ParamListBase>}></ProfileManagerComponent> : undefined
      }
    </NavigationContainer >
    ;
}
