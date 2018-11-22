import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Page } from 'ionic-angular/navigation/nav-util';
import { AppVersion } from '@ionic-native/app-version';
import { Content, Nav } from 'ionic-angular';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { AuthService } from '~/shared/api/auth.api';
import { StylistProfile } from '~/shared/api/stylist-app.models';
import { getBuildNumber } from '~/shared/get-build-info';
import { AuthState, LogoutAction } from '~/shared/storage/auth.reducer';
import { ApiResponse } from '~/shared/api/base.models';
import { deleteAuthLocalData } from '~/shared/storage/token-utils';

import { PageNames } from '~/core/page-names';
import { clearAllDataStores } from '~/core/data.module';
import { ProfileDataStore } from '~/core/profile.data';

interface MenuItem {
  title: string;
  redirectToPage: Page;
  redirectParams: any;
  icon?: string;
}

@Component({
  selector: 'made-menu',
  templateUrl: 'made-menu.component.html'
})
export class MadeMenuComponent implements OnInit, OnDestroy {
  @Input() content: Content;
  @Input() nav: Nav;

  profile: StylistProfile;
  menuItems: MenuItem[];
  appVersion: string;
  appBuildNumber = getBuildNumber();
  PageNames = PageNames;

  profileObservable: Observable<ApiResponse<StylistProfile>>;
  private profileObservableSubscription: Subscription;

  constructor(
    public profileData: ProfileDataStore,
    private authApiService: AuthService,
    private store: Store<AuthState>,
    private verProvider: AppVersion
  ) {
    this.menuItems = [
      { title: 'Appointments', redirectToPage: PageNames.HomeSlots, redirectParams: {}, icon: 'home-a' },
      { title: 'Clients', redirectToPage: PageNames.MyClients, redirectParams: {}, icon: 'stylists-a' },
      { title: 'Discounts', redirectToPage: PageNames.Discounts, redirectParams: {isRootPage: true}, icon: 'discounts' },
      { title: 'Calendar', redirectToPage: PageNames.ClientsCalendar, redirectParams: {isRootPage: true}, icon: 'calendar-add' },
      { title: 'Hours', redirectToPage: PageNames.WorkHours, redirectParams: {isRootPage: true}, icon: 'clock-a' },
      { title: 'Services', redirectToPage: PageNames.ServicesList, redirectParams: {isRootPage: true}, icon: 'conditioners-a' },
      { title: 'Invite Clients', redirectToPage: PageNames.Invitations, redirectParams: {isRootPage: true}, icon: 'invite-a' }
    ];
  }

  async ngOnInit(): Promise<void> {
    this.profileObservable = this.profileData.asObservable();

    // Initiate fetching profile data
    this.profileData.refresh();

    this.profileObservableSubscription = this.profileObservable.subscribe((profileResponse: ApiResponse<StylistProfile>) => {
      if (profileResponse.response) {
        this.profile = profileResponse.response;
      }
    });

    this.init(this.verProvider);
  }

  ngOnDestroy(): void {
    this.profileObservableSubscription.unsubscribe();
  }

  async init(verProvider: AppVersion): Promise<void> {
    try {
      this.appVersion = await verProvider.getVersionNumber();
    } catch (e) {
      // Most likely running in browser so Cordova is not available. Ignore.
      this.appVersion = 'Unknown';
    }
  }

  setPage(redirectToPage: Page, redirectParams: any, isRootPage = true): void {
    if (isRootPage) {
      // Reset the content nav to have just this page
      // we wouldn't want the back button to show in this scenario
      this.nav.setRoot(redirectToPage, redirectParams);
    } else {
      this.nav.push(redirectToPage, redirectParams);
    }
  }

  onLogoutClick(): void {
    // Logout from backend
    this.authApiService.logout();

    // Dismiss user’s state
    this.store.dispatch(new LogoutAction());

    // Clear cached data
    clearAllDataStores();

    // Delete auth stored data
    deleteAuthLocalData();

    // Erase all previous navigation history and make FirstScreen the root
    this.nav.setRoot(PageNames.FirstScreen);
  }
}