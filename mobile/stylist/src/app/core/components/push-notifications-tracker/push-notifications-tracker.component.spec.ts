import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Events, NavController, Platform, ToastController } from 'ionic-angular';
import { ToastOptions } from 'ionic-angular/components/toast/toast-options';
import { EventsMock, NavControllerMock, PlatformMock } from 'ionic-mocks';
import { Push } from '@ionic-native/push';
import { of } from 'rxjs/observable/of';
import * as moment from 'moment';
import * as faker from 'faker';

import { PushNotificationEventDetails } from '~/shared/events/shared-event-types';
import { Logger } from '~/shared/logger';
import { NotificationsApi } from '~/shared/push/notifications.api';
import { NotificationsApiMock } from '~/shared/push/notifications.api.mock';
import {
  NewAppointmentAdditionalData,
  PushNotification,
  PushNotificationCode,
  TomorrowAppointmentsAdditionalData
} from '~/shared/push/push-notification';
import { PushNotificationHandlerParams, PushNotificationToastService, ToastDismissedBy } from '~/shared/push/push-notification-toast';

import { PageNames } from '~/core/page-names';
import {
  FocusAppointmentEventParams,
  SetStylistProfileTabEventParams,
  StylistEventTypes
} from '~/core/stylist-event-types';

import { AppointmentCheckoutParams } from '~/appointment/appointment-checkout/appointment-checkout.component';
import { StylistPushNotificationsTrackerComponent } from './push-notifications-tracker.component';
import { ProfileTabs } from '~/profile/profile.component';
import { WorkHoursComponentParams } from '~/workhours/workhours.component';
import { ServicesComponentParams } from '~/services/services.component';

let instance: StylistPushNotificationsTrackerComponent;
let fixture: ComponentFixture<StylistPushNotificationsTrackerComponent>;

describe('PushNotificationTracker (client)', () => {
  beforeEach(async(() =>
    TestBed
      .configureTestingModule({
        declarations: [StylistPushNotificationsTrackerComponent],
        providers: [
          Logger,
          Push, PushNotification, PushNotificationToastService,
          { provide: NotificationsApi, useClass: NotificationsApiMock },
          // Ionic mocks:
          { provide: Events, useFactory: () => EventsMock.instance() },
          { provide: NavController, useFactory: () => NavControllerMock.instance() },
          { provide: Platform, useFactory: () => PlatformMock.instance() },
          {
            provide: ToastController,
            useClass: class ToastControllerMock {
              create = jasmine.createSpy('create').and.returnValue({
                // tslint:disable-next-line:no-null-keyword
                onDidDismiss: callback => callback(null, ToastDismissedBy.CloseClick),
                present: () => undefined
              });
            }
          }
        ]
      })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(StylistPushNotificationsTrackerComponent);
        instance = fixture.componentInstance;

        instance.nav = fixture.debugElement.injector.get(NavController);
      })
  ));

  it('should create the component', () => {
    expect(instance).toBeTruthy();
  });

  it('should handle new_appointment correctly', async done => {
    const api = fixture.debugElement.injector.get(NotificationsApi);
    const events = fixture.debugElement.injector.get(Events);
    const navCtrl = fixture.debugElement.injector.get(NavController);
    const pushToast = fixture.debugElement.injector.get(PushNotificationToastService);
    const toast = fixture.debugElement.injector.get(ToastController);

    // Subscribe to PushNotificationToastService:
    instance.ngOnInit();

    // Private to public:
    const getNotificationParams = (pushToast as any).getNotificationParams.bind(pushToast);
    const getToastOptions = (pushToast as any).getToastOptions.bind(pushToast);
    const handlePushNotificationEvent = (pushToast as any).handlePushNotificationEvent.bind(pushToast);

    const uuid = faker.random.uuid();
    const message =
      'You have a new appointment at <date-time> for $N <service-names> from <client-name/phone-number>';
    const data = {
      appointment_datetime_start_at: moment().add(1, 'day').format(),
      appointment_uuid: faker.random.uuid()
    } as NewAppointmentAdditionalData;

    // Create push-notification details:
    const details = new PushNotificationEventDetails(
      /* foreground: */ true,
      /* coldstart: */ false,
      /* uuid: */ uuid,
      /* code: */ PushNotificationCode.new_appointment,
      /* message: */ message,
      /* additional data */ data
    );

    const handlerParams: PushNotificationHandlerParams = getNotificationParams(details);
    const toastOptions: ToastOptions = getToastOptions(details, handlerParams);

    expect(toastOptions)
      .toEqual({
        ...PushNotificationToastService.defaultToastParams,
        closeButtonText: 'Open',
        message
      });

    spyOn(api, 'ackNotification').and.returnValue(of());
    await handlePushNotificationEvent(details); // handlerParams.onClick() inside

    expect(toast.create)
      .toHaveBeenCalledWith(toastOptions);
    expect(api.ackNotification)
      .toHaveBeenCalledWith({
        message_uuids: [uuid]
      });

    // Test handlerParams.onClick() call:
    expect(navCtrl.setRoot)
      .toHaveBeenCalledWith(PageNames.HomeSlots);
    expect(events.publish)
      .toHaveBeenCalledWith(
        StylistEventTypes.focusAppointment,
        data as FocusAppointmentEventParams
      );

    const checkoutParams: AppointmentCheckoutParams = {
      appointmentUuid: data.appointment_uuid,
      isReadonly: true
    };
    expect(navCtrl.push)
      .toHaveBeenCalledWith(PageNames.AppointmentCheckout, { params: checkoutParams });

    done();
  });

  it('should handle tomorrow_appointments correctly', async done => {
    const api = fixture.debugElement.injector.get(NotificationsApi);
    const events = fixture.debugElement.injector.get(Events);
    const navCtrl = fixture.debugElement.injector.get(NavController);
    const pushToast = fixture.debugElement.injector.get(PushNotificationToastService);
    const toast = fixture.debugElement.injector.get(ToastController);

    // Subscribe to PushNotificationToastService:
    instance.ngOnInit();

    // Private to public:
    const getNotificationParams = (pushToast as any).getNotificationParams.bind(pushToast);
    const getToastOptions = (pushToast as any).getToastOptions.bind(pushToast);
    const handlePushNotificationEvent = (pushToast as any).handlePushNotificationEvent.bind(pushToast);

    const uuid = faker.random.uuid();
    const message = 'You have new appointments tomorrow. Tap to see the list.';
    const data = {
      appointment_datetime_start_at: moment().add(1, 'day').format()
    } as TomorrowAppointmentsAdditionalData;

    // Create push-notification details:
    const details = new PushNotificationEventDetails(
      /* foreground: */ true,
      /* coldstart: */ false,
      /* uuid: */ uuid,
      /* code: */ PushNotificationCode.new_appointment,
      /* message: */ message,
      /* additional data */ data
    );

    const handlerParams: PushNotificationHandlerParams = getNotificationParams(details);
    const toastOptions: ToastOptions = getToastOptions(details, handlerParams);

    expect(toastOptions)
      .toEqual({
        ...PushNotificationToastService.defaultToastParams,
        closeButtonText: 'Open',
        message
      });

    spyOn(api, 'ackNotification').and.returnValue(of());
    await handlePushNotificationEvent(details); // handlerParams.onClick() inside

    expect(toast.create)
      .toHaveBeenCalledWith(toastOptions);
    expect(api.ackNotification)
      .toHaveBeenCalledWith({
        message_uuids: [uuid]
      });

    // Test handlerParams.onClick() call:
    expect(navCtrl.setRoot)
      .toHaveBeenCalledWith(PageNames.HomeSlots);
    expect(events.publish)
      .toHaveBeenCalledWith(
        StylistEventTypes.focusAppointment,
        { ...details.data, appointment_uuid: undefined } as FocusAppointmentEventParams
      );

    done();
  });

  it('should handle remind_define_services correctly', async done => {
    const api = fixture.debugElement.injector.get(NotificationsApi);
    const navCtrl = fixture.debugElement.injector.get(NavController);
    const pushToast = fixture.debugElement.injector.get(PushNotificationToastService);
    const toast = fixture.debugElement.injector.get(ToastController);

    // Subscribe to PushNotificationToastService:
    instance.ngOnInit();

    // Private to public:
    const getNotificationParams = (pushToast as any).getNotificationParams.bind(pushToast);
    const getToastOptions = (pushToast as any).getToastOptions.bind(pushToast);
    const handlePushNotificationEvent = (pushToast as any).handlePushNotificationEvent.bind(pushToast);

    const uuid = faker.random.uuid();
    const message = 'Don\'t forget! Update your services and pricing in Made Pro so clients can start booking.';

    // Create push-notification details:
    const details = new PushNotificationEventDetails(
      /* foreground: */ true,
      /* coldstart: */ true,
      /* uuid: */ uuid,
      /* code: */ PushNotificationCode.remind_define_services,
      /* message: */ message
    );

    const handlerParams: PushNotificationHandlerParams = getNotificationParams(details);
    const toastOptions: ToastOptions = getToastOptions(details, handlerParams);

    expect(toastOptions)
      .toEqual({
        ...PushNotificationToastService.defaultToastParams,
        closeButtonText: 'Open',
        message
      });

    spyOn(api, 'ackNotification').and.returnValue(of());
    await handlePushNotificationEvent(details); // handlerParams.onClick() inside

    expect(toast.create)
      .toHaveBeenCalledWith(toastOptions);
    expect(api.ackNotification)
      .toHaveBeenCalledWith({
        message_uuids: [uuid]
      });

    // Test handlerParams.onClick() call:
    const params: ServicesComponentParams = { isRootPage: true };
    expect(navCtrl.setRoot)
      .toHaveBeenCalledWith(PageNames.Services, { params });

    done();
  });

  it('should handle remind_add_photo correctly', async done => {
    const api = fixture.debugElement.injector.get(NotificationsApi);
    const events = fixture.debugElement.injector.get(Events);
    const navCtrl = fixture.debugElement.injector.get(NavController);
    const pushToast = fixture.debugElement.injector.get(PushNotificationToastService);
    const toast = fixture.debugElement.injector.get(ToastController);

    // Subscribe to PushNotificationToastService:
    instance.ngOnInit();

    // Private to public:
    const getNotificationParams = (pushToast as any).getNotificationParams.bind(pushToast);
    const getToastOptions = (pushToast as any).getToastOptions.bind(pushToast);
    const handlePushNotificationEvent = (pushToast as any).handlePushNotificationEvent.bind(pushToast);

    const uuid = faker.random.uuid();
    const message = 'We noticed that you do not have a photo in Made Pro. Stylists who have a photo have on average about 60% higher chance to get a booking.';

    // Create push-notification details:
    const details = new PushNotificationEventDetails(
      /* foreground: */ true,
      /* coldstart: */ true,
      /* uuid: */ uuid,
      /* code: */ PushNotificationCode.remind_add_photo,
      /* message: */ message
    );

    const handlerParams: PushNotificationHandlerParams = getNotificationParams(details);
    const toastOptions: ToastOptions = getToastOptions(details, handlerParams);

    expect(toastOptions)
      .toEqual({
        ...PushNotificationToastService.defaultToastParams,
        closeButtonText: 'Add Photo',
        message
      });

    spyOn(api, 'ackNotification').and.returnValue(of());
    await handlePushNotificationEvent(details); // handlerParams.onClick() inside

    expect(toast.create)
      .toHaveBeenCalledWith(toastOptions);
    expect(api.ackNotification)
      .toHaveBeenCalledWith({
        message_uuids: [uuid]
      });

    // Test handlerParams.onClick() call:
    expect(navCtrl.setRoot)
      .toHaveBeenCalledWith(PageNames.Profile);
    expect(events.publish)
      .toHaveBeenCalledWith(
        StylistEventTypes.setStylistProfileTab,
        { profileTab: ProfileTabs.edit } as SetStylistProfileTabEventParams
      );

    done();
  });

  it('should handle remind_define_hours correctly', async done => {
    const api = fixture.debugElement.injector.get(NotificationsApi);
    const navCtrl = fixture.debugElement.injector.get(NavController);
    const pushToast = fixture.debugElement.injector.get(PushNotificationToastService);
    const toast = fixture.debugElement.injector.get(ToastController);

    // Subscribe to PushNotificationToastService:
    instance.ngOnInit();

    // Private to public:
    const getNotificationParams = (pushToast as any).getNotificationParams.bind(pushToast);
    const getToastOptions = (pushToast as any).getToastOptions.bind(pushToast);
    const handlePushNotificationEvent = (pushToast as any).handlePushNotificationEvent.bind(pushToast);

    const uuid = faker.random.uuid();
    const message = 'Don\'t forget! Update your hours in Made Pro so clients can start booking.';

    // Create push-notification details:
    const details = new PushNotificationEventDetails(
      /* foreground: */ true,
      /* coldstart: */ true,
      /* uuid: */ uuid,
      /* code: */ PushNotificationCode.remind_define_hours,
      /* message: */ message
    );

    const handlerParams: PushNotificationHandlerParams = getNotificationParams(details);
    const toastOptions: ToastOptions = getToastOptions(details, handlerParams);

    expect(toastOptions)
      .toEqual({
        ...PushNotificationToastService.defaultToastParams,
        closeButtonText: 'Update Hours',
        message
      });

    spyOn(api, 'ackNotification').and.returnValue(of());
    await handlePushNotificationEvent(details); // handlerParams.onClick() inside

    expect(toast.create)
      .toHaveBeenCalledWith(toastOptions);
    expect(api.ackNotification)
      .toHaveBeenCalledWith({
        message_uuids: [uuid]
      });

    // Test handlerParams.onClick() call:
    const params: WorkHoursComponentParams = { isRootPage: true };
    expect(navCtrl.setRoot)
      .toHaveBeenCalledWith(PageNames.WorkHours, { params });

    done();
  });
});
