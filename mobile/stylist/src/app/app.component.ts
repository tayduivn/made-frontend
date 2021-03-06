import { Component, ViewChild } from '@angular/core';
import { Events, Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ScreenOrientation } from '@ionic-native/screen-orientation';

import { async_all } from '~/shared/async-helpers';
import { Logger } from '~/shared/logger';
import { getBuildNumber, getCommitHash } from '~/shared/get-build-info';
import { AppAnalytics } from '~/shared/app-analytics';
import { StylistProfileStatus } from '~/shared/api/stylist-app.models';
import { PushNotification } from '~/shared/push/push-notification';

import { PageNames } from '~/core/page-names';
import { createNavHistoryList } from '~/core/functions';
import { ServerStatusTracker } from '~/shared/server-status-tracker';
import { ENV } from '~/environments/environment.default';
import { AuthService } from './shared/api/auth.api';
import { deleteAuthLocalData, getAuthLocalData } from './shared/storage/token-utils';
import { AuthResponse } from './shared/api/auth.models';
import { SharedEventTypes } from './shared/events/shared-event-types';
import { StylistAppStorage } from './core/stylist-app-storage';

@Component({
  templateUrl: 'app.component.html'
})
export class MyAppComponent {
  @ViewChild(Nav) nav: Nav;

  constructor(
    private events: Events,
    public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    private authApiService: AuthService,
    private logger: Logger,
    private analytics: AppAnalytics,
    private pushNotification: PushNotification,
    private serverStatusTracker: ServerStatusTracker,
    private storage: StylistAppStorage,
    private screenOrientation: ScreenOrientation
  ) {
    this.logger.info('App: initializing...');
    this.logger.info(`Build: ${getBuildNumber()} Commit: ${getCommitHash()}`);

    this.initializeApp();
  }

  async initializeApp(): Promise<void> {
    const startTime = Date.now();

    // The call of `deleteAuthLocalData` prevents weird error of allways navigating to the Auth page.
    this.serverStatusTracker.init(PageNames.FirstScreen, deleteAuthLocalData);

    // First initialize the platform. We cannot do anything else until the platform is
    // ready and the plugins are available.
    await this.platform.ready();

    // Now that the platform is ready asynchronously initialize in parallel everything
    // that our app needs and wait until all initializations finish. Add here any other
    // initialization operation that must be done before the initial page is shown.
    await async_all([
      this.analytics.init(ENV.gaTrackingId),
      this.storage.init()
    ]);

    await this.pushNotification.init(this.storage);

    // Lock screen orientation to portrait if this is real device
    if (!(this.platform.is('core') || this.platform.is('mobileweb'))) {
      this.screenOrientation.lock('portrait');
    }

    // Track all top-level screen changes
    this.nav.viewDidEnter.subscribe(view => this.analytics.trackViewChange(view));

    // All initializations are done, show the initial page to the user
    await this.showInitialPage();

    // The initial page is ready to be seen, hide the splash screen
    this.splashScreen.hide();
    this.statusBar.styleDefault();

    if (this.platform.is('android')) {
      this.statusBar.styleLightContent();
    }

    // Notify that init is done
    this.events.publish(SharedEventTypes.appLoaded);

    // All done, measure the loading time and report to GA
    const loadTime = Date.now() - startTime;
    this.logger.info('App: loaded in', loadTime, 'ms');

    this.analytics.trackTiming('Loading', loadTime, 'AppInitialization', 'FirstLoad');
  }

  async showInitialPage(): Promise<void> {
    const token = await getAuthLocalData(); // no expiration
    if (token) {
      this.logger.info('App: We have a stored authentication information. Attempting to restore.');

      // We were previously authenticated, let's try to refresh the token
      // and validate it and show the correct page after that.
      let authResponse: AuthResponse;
      try {
        authResponse = (await this.authApiService.refreshAuth(token.token).get()).response;
      } catch (e) {
        this.logger.error('App: Error when trying to refresh auth.', e);
      }
      // Find out what page should be shown to the user and navigate to
      // it while also properly populating the navigation history
      // so that Back buttons work correctly.
      if (authResponse) {
        this.logger.info('App: Authentication refreshed.');

        // Let pushNotification know who is the current user
        this.pushNotification.setUser(authResponse.user_uuid);

        const requiredPages = await createNavHistoryList(authResponse.profile_status as StylistProfileStatus);
        await this.nav.setPages(requiredPages);
        return;
      }
    }

    this.logger.info('App: No valid authenticated session. Start from first screen.');

    // No valid saved authentication, just show the first screen.
    await this.nav.setRoot(PageNames.FirstScreen, {}, { animate: false }, () => this.statusBar.hide());
  }
}
