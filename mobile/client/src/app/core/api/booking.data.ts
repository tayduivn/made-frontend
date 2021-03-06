import { Injectable, OnDestroy } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { DayOffer, ServiceModel } from '~/shared/api/price.models';
import { StylistModel } from '~/shared/api/stylists.models';
import { Logger } from '~/shared/logger';
import { DataStore } from '~/shared/storage/data-store';
import { BookingApi, TimeslotsResponse } from '~/core/api/booking.api';
import { GetPricelistResponse } from '~/core/api/services.models';
import { ApiResponse } from '~/shared/api/base.models';
import { ServicesService } from './services.service';

interface DayOfferWithTotalRegularPrice extends DayOffer {
  totalRegularPrice: number;
}

/**
 * Singleton that stores current booking process data.
 */
@Injectable()
export class BookingData implements OnDestroy {
  private static guardInitilization = false;

  selectedTime: moment.Moment;

  private _stylist: StylistModel;
  private _selectedServices: ServiceModel[];
  private _date: moment.Moment;
  private _offer: DayOfferWithTotalRegularPrice;
  private _pricelist: DataStore<GetPricelistResponse>;
  private _timeslots: DataStore<TimeslotsResponse>;
  private _appointmentUuid: string;

  private servicesSubject: BehaviorSubject<ServiceModel[]>;
  private servicesSubscription: Subscription;

  constructor(
    private api: BookingApi,
    private servicesApi: ServicesService,
    protected logger: Logger
  ) {
    if (BookingData.guardInitilization) {
      logger.error('BookingData initialized twice. Only include it in providers array of DataModule.');
    }
    BookingData.guardInitilization = true;

    this.servicesSubject = new BehaviorSubject<ServiceModel[]>([]);

    // Recalculate offer's price on services change:
    this.servicesSubscription = this.selectedServicesObservable.subscribe(async () => {
      if (this._pricelist && this._offer) {
        const { response } = await this.pricelist.get();
        const newOffer = response && response.prices.find(offer => this._offer && offer.date === this._offer.date);
        if (newOffer) {
          this.setOffer(newOffer);
        } else {
          // This can happen in an edge case when the date becomes no longer available for booking if e.g.
          // - ist‘s too late for this date
          // - or when there is no free timeslot.
          this.setOffer(undefined);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.servicesSubscription.unsubscribe();
  }

  /**
   * Begin new appointment booking process. Called by "Book Appointment" button.
   * @param stylist the stylist with whom to start booking.
   */
  start(stylist: StylistModel): void {
    this._stylist = stylist;

    // clear previous booking information
    if (this._pricelist) {
      this._pricelist.deleteCache();
    }
    if (this._timeslots) {
      this._timeslots.deleteCache();
    }

    this._selectedServices = undefined;
    this._offer = undefined;
    this._date = undefined;
    this.selectedTime = undefined;
    this._pricelist = undefined;
    this._timeslots = undefined;
  }

  deleteService(service: ServiceModel): void {
    const index = this._selectedServices.findIndex(v => v === service);
    if (index >= 0) {
      this._selectedServices.splice(index, 1);
      this.setSelectedServices(this._selectedServices);
      this.onServicesChange();
    }
  }

  /**
   * Set the list of selected services for the new appointment. Called when the user chooses services.
   * If services parameter is empty list then we will fetch the pricing for the most popular service.
   * The most popular service uuid will be returned in the response in that case.
   */
  setSelectedServices(services: ServiceModel[]): Promise<ApiResponse<GetPricelistResponse>> {
    // remember the list of services
    this._selectedServices = services;

    if (this._pricelist) {
      this._pricelist.deleteCache();
    }

    // create an API-backed cached pricelist
    this._pricelist = new DataStore('booking_pricelist',
      options => this.api.getPricelist(this._selectedServices, this._stylist.uuid, options),
      { cacheTtlMilliseconds: 0 });  // 0 cache ttl for data that can be externally modified

    this.onServicesChange();

    // Preload prices (don't show alerts on errors since this is just preloading)
    // We don't want to show alert during preloading if there is an API error.
    // It results in duplicate alerts: one during preloading and another when
    // the view that needs the data tries to access it and another API call
    // is issued (because of error the preloading call fails and no response
    // is cached and thus we issue a second API call correctly which again
    // results in error and in alert). Setting hideGenericAlertOnFieldAndNonFieldErrors=true
    // prevents this double alerts on errors and is the best practice for preloading.
    return this._pricelist.get({ refresh: true, requestOptions: { hideGenericAlertOnFieldAndNonFieldErrors: true } });
  }

  /**
   * Set the list of selected services to be the most popular service for this stylist.
   */
  async selectMostPopularService(): Promise<ApiResponse<GetPricelistResponse>> {
    // When in the pricing request we do not specify services we expect the backend to
    // find the most popular service and calculate the prices for it. In the API response
    // we will also have the most popular service uuid.
    const pricingApiResponse = await this.setSelectedServices([]);

    if (pricingApiResponse.response) {
      // The uuid of the service(s) that the backend returned is stored in
      // pricingApiResponse.response.service_uuids array.
      // Now we need to convert service uuids to full ServiceModel.
      // We are making an extra request here, which is suboptimial. We could technically
      // modify the getPricelist() to return full ServiceModel instead of just uuids but
      // this is a rare case and we do not want to taylor the API to this rare case just to
      // avoid one extra other API call.
      this._selectedServices = await this.getServicesByUuids(pricingApiResponse.response.service_uuids);

      // Let outside world know that we have a different list of services.
      this.onServicesChange();
    }

    return pricingApiResponse;
  }

  hasSelectedService(service: ServiceModel): boolean {
    return Boolean(this._selectedServices) && this._selectedServices.some(selectedService => selectedService.uuid === service.uuid);
  }

  setOffer(offer: DayOffer): void {
    if (offer === undefined) {
      this._offer = undefined;
      this._timeslots = undefined;
      return;
    }

    const date = moment(offer.date);

    if (!this._timeslots || !date.isSame(this._date)) {
      this._date = date;

      if (this._timeslots) {
        this._timeslots.deleteCache();
      }

      // Save in closure:
      const stylistUuid = this._stylist.uuid;

      // create an API-backed cached timeslots
      this._timeslots = new DataStore('booking_timeslots',
        () => this.api.getTimeslots(stylistUuid, date),
        { cacheTtlMilliseconds: 0 });  // 0 cache ttl for data that can be externally modified
    }

    this._offer = {
      ...offer,
      totalRegularPrice: this._selectedServices.reduce((sum, service) => sum + service.base_price, 0)
    };
  }

  seAppointmentUuid(uuid: string): void {
    this._appointmentUuid = uuid;
  }

  get appointmentUuid(): string {
    return this._appointmentUuid;
  }

  get stylist(): StylistModel {
    return this._stylist;
  }

  get offer(): DayOfferWithTotalRegularPrice {
    return this._offer;
  }

  get date(): moment.Moment {
    return this._date;
  }

  get selectedServices(): ServiceModel[] {
    return this._selectedServices;
  }

  get pricelist(): DataStore<GetPricelistResponse> {
    return this._pricelist;
  }

  get timeslots(): DataStore<TimeslotsResponse> {
    return this._timeslots;
  }

  get selectedServicesObservable(): Observable<ServiceModel[]> {
    return this.servicesSubject.asObservable();
  }

  private onServicesChange(): void {
    // Tell subscribers to update services:
    this.servicesSubject.next(this._selectedServices);
  }

  /**
   * Gets current stylist's services by the uuids
   */
  private async getServicesByUuids(serviceUuids: string[]): Promise<ServiceModel[]> {
    // Get all services of the stylist
    const stylistServicesResponse = await (this.servicesApi.getStylistServices({
      stylist_uuid: this._stylist.uuid
    })).get();

    const stylistServices = stylistServicesResponse.response;
    if (stylistServices) {
      // Filter only the services that have the uuids that we need
      const relevantServicesNested: ServiceModel[][] =
        stylistServices.categories.map(category => category.services.filter(service => serviceUuids.indexOf(service.uuid) >= 0));

      // Flaten the array of arrays of ServiceModels
      const relevantServices: ServiceModel[] = [].concat(...relevantServicesNested);
      return relevantServices;
    }

    return [];
  }
}
