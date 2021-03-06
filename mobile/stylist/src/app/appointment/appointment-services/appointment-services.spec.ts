import * as faker from 'faker';

import { async, ComponentFixture } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { prepareSharedObjectsForTests } from '~/core/test-utils.spec';
import { TestUtils } from '~/../test';

import {
  LoadSuccessAction,
  selectSelectedService,
  servicesReducer,
  ServicesState
} from '~/appointment/appointment-services/services.reducer';

import { AppointmentServicesComponent } from './appointment-services';

let fixture: ComponentFixture<AppointmentServicesComponent>;
let instance: AppointmentServicesComponent;
let store: Store<ServicesState>;

const fakeCategory = {
  uuid: faker.random.uuid(),
  category_code: faker.lorem.word(),
  name: faker.commerce.productMaterial(),
  services: Array(5).fill(undefined).map(() => ({
    uuid: faker.random.uuid(),
    category_uuid: faker.random.uuid(),
    category_name: faker.lorem.word(),
    name: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    base_price: parseInt(faker.commerce.price(), 10),
    duration_minutes: faker.random.number(),
    is_enabled: true,
    photo_samples: []
  }))
};

describe('Pages: Choose date and time of the Appointment', () => {

  prepareSharedObjectsForTests();

  beforeEach(async () => TestUtils.beforeEachCompiler([
    AppointmentServicesComponent
  ], [], [
    StoreModule.forFeature('service', servicesReducer)
  ]).then(compiled => {
    fixture = compiled.fixture;
    instance = compiled.instance;

    store = fixture.debugElement.injector.get(Store);

    // subscribe to store
    instance.ionViewWillLoad();
  }));

  it('should create the page', async(() => {
    expect(instance)
      .toBeTruthy();
  }));

  it('should show stylist services', async(() => {
    store.dispatch(new LoadSuccessAction([fakeCategory]));

    fixture.detectChanges();

    // contains category with services amount
    expect(fixture.nativeElement.textContent)
      .toContain(`${fakeCategory.name} ${fakeCategory.services.length}`);

    // contains services
    fakeCategory.services.forEach(service => {
      expect(fixture.nativeElement.textContent)
        .toContain(service.name);
    });
  }));

  it('should allow to select a service', async(() => {
    store.dispatch(new LoadSuccessAction([fakeCategory]));

    fixture.detectChanges();

    const serviceRow = fixture.nativeElement.querySelector('.DiscountsList-row');
    const serviceName = serviceRow.querySelector('.DiscountsList-col').textContent;

    let selectedService;

    const subscription =
      store
        .select(selectSelectedService)
        .subscribe(service => selectedService = service);

    // choose service
    serviceRow.click();
    subscription.unsubscribe();

    expect(serviceName)
      .toContain(selectedService.name);
  }));
});
