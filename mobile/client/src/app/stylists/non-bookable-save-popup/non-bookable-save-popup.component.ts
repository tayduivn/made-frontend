import { Component, OnInit } from '@angular/core';
import { App, Events, NavParams, ViewController } from 'ionic-angular';

import { StylistModel } from '~/shared/api/stylists.models';
import { EventTypes } from '~/core/event-types';
import { Tabs } from '~/stylists/my-stylists.component';

export interface NonBookableSavePopupParams {
  stylist: StylistModel;
}

@Component({
  selector: 'non-bookable-save-popup',
  templateUrl: 'non-bookable-save-popup.component.html'
})
export class NonBookableSavePopupComponent implements OnInit {
  static cssClass = 'NonBookableSavePopup';

  stylist: StylistModel;

  constructor(
    private app: App,
    private events: Events,
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
  }

  ngOnInit(): void {
    const { stylist } = (this.navParams.get('params') || {}) as NonBookableSavePopupParams;
    this.stylist = stylist;
  }

  onClose(): void {
    this.viewCtrl.dismiss();
  }

  async onRedirectToSavedStylists(): Promise<void> {
    this.onClose();
    await this.app.getRootNav().popToRoot();
    this.events.publish(EventTypes.selectStylistTab, Tabs.savedStylists);
  }
}
