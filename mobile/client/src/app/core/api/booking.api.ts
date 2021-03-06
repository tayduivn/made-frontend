import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import * as moment from 'moment';

import { ApiResponse, ISODateTime } from '~/shared/api/base.models';
import { ClientAppointmentModel } from '~/shared/api/appointments.models';
import { ApiRequestOptions } from '~/shared/api-errors';
import { Logger } from '~/shared/logger';
import { ServerStatusTracker } from '~/shared/server-status-tracker';
import { ServiceModel } from '~/shared/api/price.models';

import { BaseService } from '~/shared/api/base.service';
import { GetPricelistResponse } from '~/core/api/services.models';

interface TimeslotModel {
  start: ISODateTime;
  end: ISODateTime;
  is_booked: boolean;
}

export interface TimeslotsResponse {
  time_slots: TimeslotModel[];
}

interface AppointmentRequestService {
  service_uuid: string;
}

export interface CreateAppointmentRequest {
  stylist_uuid: string;
  datetime_start_at: ISODateTime;
  services: AppointmentRequestService[];
  has_card_fee_included?: boolean;
  has_tax_included?: boolean;
}

@Injectable()
export class BookingApi extends BaseService {

  constructor(
    http: HttpClient,
    logger: Logger,
    serverStatus: ServerStatusTracker
  ) {
    super(http, logger, serverStatus);
  }

  getTimeslots(stylistUuid: string, date: moment.Moment): Observable<ApiResponse<TimeslotsResponse>> {
    const params = {
      date: date.format('YYYY-MM-DD'),
      stylist_uuid: stylistUuid
    };
    return this.post<TimeslotsResponse>('client/available-times', params);
  }

  getPricelist(services: ServiceModel[], stylistUuid: string, options?: ApiRequestOptions): Observable<ApiResponse<GetPricelistResponse>> {
    const data = {
      service_uuids: services.map(service => service.uuid),
      stylist_uuid: stylistUuid
    };
    return this.post<GetPricelistResponse>('client/services/pricing', data, undefined, options);
  }

  createAppointment(appointment: CreateAppointmentRequest): Observable<ApiResponse<ClientAppointmentModel>> {
    return this.post<ClientAppointmentModel>('client/appointments', appointment);
  }

  previewAppointment(appointment: CreateAppointmentRequest): Observable<ApiResponse<ClientAppointmentModel>> {
    return this.post<ClientAppointmentModel>('client/appointments/preview', appointment);
  }
}
