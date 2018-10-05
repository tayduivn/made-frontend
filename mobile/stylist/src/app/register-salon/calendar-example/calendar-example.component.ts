import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import * as moment from 'moment';

import { PageNames } from '~/core/page-names';
import { DayOffer, ServiceModel } from '~/shared/api/price.models';

// Some nice looking fake prices
const fakePrices = [
  200, 200, 200, undefined,
  200, 170, 160, 190, 190, 200, undefined,
  190, 185, 160, 190, 200, 200, 200,
  200, 170, undefined, 200, 200, undefined, 200,
  200, 185, 170
];

@Component({
  selector: 'page-calendar-example',
  templateUrl: 'calendar-example.component.html'
})
export class CalendarExampleComponent {
  PageNames = PageNames;

  regularPrice = 200;

  // Fake service
  services: ServiceModel[] = [{
    uuid: undefined,
    name: 'Color Correction',
    base_price: this.regularPrice
  }];

  prices: DayOffer[] = [];

  constructor(
    private navCtrl: NavController) {
    // Generate offers starting from today using fake prices
    for (let i = 0; i < fakePrices.length; i++) {
      this.prices.push({
        date: moment().add(i, 'days').format('YYYY-MM-DD'),
        price: fakePrices[i],
        is_fully_booked: fakePrices[i] === undefined,
        is_working_day: fakePrices[i] !== undefined
      });
    }
  }

  onContinue(): void {
    this.navCtrl.push(PageNames.Invitations);
  }
}