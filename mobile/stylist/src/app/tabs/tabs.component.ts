import { Component } from '@angular/core';
import { IonicPage, Tab } from 'ionic-angular';

import { GAWrapper } from '~/shared/google-analytics';
import { PageNames } from '~/core/page-names';
import { ENV } from '~/../environments/environment.default';

interface TabsObject {
  name: string;
  link: PageNames;
  params: any;
}

@IonicPage({
  segment: 'tabs'
})
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.component.html'
})
export class TabsComponent {
  protected tabsData: TabsObject[] = [
    {
      name: 'Home',
      link: PageNames.Home,
      params: undefined
    },
    {
      name: 'Hours',
      link: PageNames.Worktime,
      params: { isProfile: true }
    },
    {
      name: 'Discount',
      link: PageNames.Discounts,
      params: { isProfile: true }
    },
    {
      name: 'Services',
      link: PageNames.ServicesList,
      params: { isProfile: true }
    }
  ];

  private lastSubsrciption: any;

  constructor(
    private ga: GAWrapper
  ) {
    if (ENV.ffEnableIncomplete) {
      this.tabsData.push({
        name: 'Invite',
        link: PageNames.Invitations,
        params: { isMainScreen: true }
      });
    }
  }

  onTabChange(tab: Tab): void {
    // Track all tab changes
    this.ga.trackView(tab.tabTitle);

    // Track all screen changes inside tab
    if (this.lastSubsrciption) {
      this.lastSubsrciption.unsubscribe();
    }
    this.lastSubsrciption = tab.viewDidEnter.subscribe(view => this.ga.trackViewChange(view));
  }
}