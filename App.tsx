import { NavigationContainer, NavigationProp, ParamListBase } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { EventType, ToggleProfileManagerEvent, User, ToggleActionSheetEvent, } from './src/types';
import { settingsGlobals } from './src/globals/settingsGlobals';
import { themeStyles, updateThemeStyles } from './styles/globalColors';
import { globals } from './src/globals/globals';
import { constants } from './src/globals/constants';
import { SnackbarComponent } from './src/components/snackbarComponent';
import { cache, initCache } from './src/services/dataCaching/cache';
import { notificationsService } from './src/services/notificationsService';
import { LoginNavigator } from './src/navigation/loginNavigator';
import { ActionSheet } from './src/components/actionSheet.component';
import { DiamondAnimationComponent } from '@components/diamondAnimation.component';
import { api, cloutFeedApi } from '@services';
import { enableScreens } from 'react-native-screens';
import { signing } from '@services/authorization/signing';
import { authentication } from '@services/authorization/authentication';
import { ProfileManagerComponent } from '@components/profileManager.component';
import { eventManager, hapticsManager } from '@globals/injector';
import { TabNavigator } from './src/navigation/tabNavigator';
import MessageStackScreen from './src/navigation/messageStackNavigator';
import { ActionSheetConfig } from '@services/actionSheet';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { stackConfig } from './src/navigation/stackNavigationConfig';
import CloutFeedIntroduction from '@screens/introduction/cloutFeedIntroduction.screen';
import TermsConditionsScreen from '@screens/login/termsAndConditions.screen';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Platform, StatusBar, View } from 'react-native';
import { AppState } from 'react-native';
import { messagesService } from './src/services/messagesServices';
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
  const [isThemeSet, setIsThemeSet] = useState<boolean>(false);
  const initialNotificationInterval = useRef(0);
  const backgroundNotificationInterval = useRef(0);
  const backgroundMessageInterval = useRef(0);
  const initialMessageInterval = useRef(0);
  const appState = useRef(AppState.currentState);
  const isMounted = useRef<boolean>(true);
  const intervalTiming = 30000;

  function handleAppStateChange(nextAppState: any) {
    if (globals.readonly) {
      return;
    }
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      window.clearInterval(initialNotificationInterval.current);
      backgroundNotificationInterval.current = window.setInterval(notificationListener, intervalTiming);
      backgroundMessageInterval.current = window.setInterval(globals.dispatchRefreshMessagesEvent, intervalTiming);
    } else {
      window.clearInterval(backgroundNotificationInterval.current);
      window.clearInterval(initialMessageInterval.current);

    }
    appState.current = nextAppState;
  }

  useEffect(
    () => {
      AppState.addEventListener('change', handleAppStateChange);

      return () => {
        window.clearInterval(backgroundNotificationInterval.current);
        window.clearInterval(backgroundMessageInterval.current);
        AppState.removeEventListener('change', handleAppStateChange);
      };

    },
    []
  );

  useEffect(
    () => {

      const unsubscribeProfileManager = eventManager.addEventListener(
        EventType.ToggleProfileManager,
        (event: ToggleProfileManagerEvent) => {
          if (isMounted) {
            setShowProfileManager(event.visible);
            setNavigation(event.navigation);
          }
        }
      );
      const unsubscribeActionSheet = eventManager.addEventListener(
        EventType.ToggleActionSheet,
        (event: ToggleActionSheetEvent) => {
          if (isMounted) {
            setActionSheetConfig(event.config);
            setShowActionSheet(event.visible);
          }
        }
      );

      checkAuthenticatedUser().then(() => undefined).catch(() => undefined);

      return () => {
        unsubscribeProfileManager();
        unsubscribeActionSheet();
        window.clearInterval(initialNotificationInterval.current);
        window.clearInterval(initialMessageInterval.current);
        isMounted.current = false;
      };
    },
    []
  );

  function notificationListener() {
    api.getNotifications(globals.user.publicKey, -1, 5).then(
      (response: any) => {
        const newSeenNotificationIndex: number = response.Notifications[0].Index;
        SecureStore.getItemAsync('lastNotificationIndex').then(
          (prevStoredIndex: string | null) => {
            if (newSeenNotificationIndex > parseInt(prevStoredIndex as string)) {
              eventManager.dispatchEvent(
                EventType.RefreshNotifications,
                newSeenNotificationIndex
              );
            } else {
              eventManager.dispatchEvent(EventType.RefreshNotifications, -1);
            }
          }
        )
          .catch(() => undefined);
      }
    ).catch(() => undefined);
  }

  async function checkAuthenticatedUser() {
    try {

      const publicKey = await SecureStore.getItemAsync(constants.localStorage_publicKey);
      if (publicKey) {
        const cloutFeedIdentity = await SecureStore.getItemAsync(constants.localStorage_cloutFeedIdentity);

        if (cloutFeedIdentity) {
          globals.user.publicKey = publicKey;
          await setTheme(true);
          setIsThemeSet(true);
          const readonlyValue = await SecureStore.getItemAsync(constants.localStorage_readonly);
          globals.readonly = readonlyValue !== 'false';
          globals.onLoginSuccess();
        } else {
          await SecureStore.deleteItemAsync(constants.localStorage_publicKey);
          await SecureStore.deleteItemAsync(constants.localStorage_readonly);

          if (isMounted) {
            setTermsAccepted(true);
            setLoading(false);
          }
        }
      } else {
        const termsAccepted = await SecureStore.getItemAsync(constants.localStorage_termsAccepted);

        if (isMounted) {
          setTermsAccepted(termsAccepted === 'true');
          setLoading(false);
        }
      }
    } catch {
      return;
    }
  }

  globals.dispatchRefreshMessagesEvent = () => {
    messagesService.getUnreadMessages()
      .then(
        (response: number) => {
          eventManager.dispatchEvent(EventType.RefreshMessages, response);
        }
      ).catch(() => undefined);
  };

  globals.acceptTermsAndConditions = () => {
    if (isMounted) {
      setTermsAccepted(true);
    }
  };

  globals.onLoginSuccess = () => {
    cache.user.reset();
    if (isMounted) {
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
          notificationListener();
          globals.dispatchRefreshMessagesEvent();

          initialNotificationInterval.current = window.setInterval(notificationListener, intervalTiming);
          initialMessageInterval.current = window.setInterval(globals.dispatchRefreshMessagesEvent, intervalTiming);
        }
        await setTheme();
        await hapticsManager.init();
      }
    ).catch(() => undefined).finally(
      () => {
        if (isMounted) {
          setLoggedIn(true);
          setTermsAccepted(true);
          setLoading(false);
        }
      }
    );
  };

  globals.onLogout = async () => {
    if (isMounted) {
      setLoading(true);
    }

    await SecureStore.deleteItemAsync(constants.localStorage_publicKey);
    await SecureStore.deleteItemAsync(constants.localStorage_readonly);

    if (globals.readonly === false) {
      const jwt = await signing.signJWT();
      cloutFeedApi.unregisterNotificationsPushToken(globals.user.publicKey, jwt).catch(() => undefined);
      await authentication.removeAuthenticatedUser(globals.user.publicKey);
      window.clearInterval(initialNotificationInterval.current);
      window.clearInterval(backgroundNotificationInterval.current);
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

    if (isMounted) {
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

  return <View style={[{ flex: 1 }, themeStyles.containerColorMain]}>
    {
      settingsGlobals.darkMode ?
        Platform.OS == 'ios' ? <ExpoStatusBar style='light' /> :
          <StatusBar barStyle={'light-content'} /> :
        <ExpoStatusBar style='dark' />
    }

    {
      isLoading ?
        isThemeSet ? <CloutFeedLoader /> : <></>
        :
        <NavigationContainer>
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
        </NavigationContainer>
    }
  </View>;
}
