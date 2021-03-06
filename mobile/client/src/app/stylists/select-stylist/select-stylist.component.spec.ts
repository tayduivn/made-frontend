import { async, ComponentFixture } from '@angular/core/testing';
import { Events } from 'ionic-angular';
import { of } from 'rxjs/observable/of';

import { TestUtils } from '~/../test';

import { StylistsService } from '~/core/api/stylists.service';
import { stylistsMock } from '~/core/api/stylists.service.mock';
import { ClientEventTypes } from '~/core/client-event-types';

import { MainTabIndex } from '~/main-tabs/main-tabs.component';
import { SelectStylistComponent } from '~/stylists/select-stylist/select-stylist.component';

let fixture: ComponentFixture<SelectStylistComponent>;
let instance: SelectStylistComponent;

describe('Pages: Select Stylist', () => {
  beforeEach(
    async(() =>
      TestUtils.beforeEachCompiler([SelectStylistComponent])
        .then(compiled => {
          fixture = compiled.fixture;
          instance = compiled.instance;
        })
    )
  );

  it('should create the page', () => {
    expect(instance)
      .toBeTruthy();
  });

  it('should show header', () => {
    expect(fixture.nativeElement.textContent)
      .toContain('Select Stylist');
  });

  it('should show stylists cards', async done => {
    await instance.ionViewWillEnter();
    fixture.detectChanges();

    stylistsMock
      .filter(stylist => stylist.is_profile_bookable)
      .forEach(stylist => {
        expect(fixture.nativeElement.textContent)
          .toContain(`${stylist.first_name} ${stylist.last_name}`);
        expect(fixture.nativeElement.textContent)
          .toContain(stylist.salon_name);
        expect(fixture.nativeElement.textContent)
          .toContain(`${stylist.followers_count} MADE Clients`);
      });

    done();
  });

  it('should redirect to Home with Stylist tab open when no preferred', async done => {
    const stylistsService = fixture.debugElement.injector.get(StylistsService);
    spyOn(stylistsService, 'getPreferredStylists').and.returnValue(
      of({ response: { stylists: [] } })
    );

    await instance.ionViewWillEnter();
    fixture.detectChanges();

    const events = fixture.debugElement.injector.get(Events);
    // change redirect to stylists page when it will be ready
    expect(events.publish)
      .toHaveBeenCalledWith(ClientEventTypes.selectMainTab, MainTabIndex.Home, instance.showNoSelectedStylistWarning);

    done();
  });
});
