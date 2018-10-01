import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { ApiRequestOptions } from '~/shared/api-errors';
import { ApiResponse } from '~/shared/api/base.models';

import {
  Appointment,
  AppointmentChangeRequest,
  AppointmentParams,
  AppointmentPreviewRequest,
  AppointmentPreviewResponse,
  AppointmentStatuses,
  Home,
  NewAppointmentRequest
} from './home.models';

@Injectable()
export class HomeServiceMock {

  /**
   * Get home page data. The stylist must be already authenticated as a user.
   */
  getHome(query: string): Observable<ApiResponse<Home>> {
    return Observable.of({
      response: {
        appointments: [],
        today_visits_count: 0,
        upcoming_visits_count: 0
      }
    });
  }

  /**
   * Get all appointments. The stylist must be already authenticated as a user.
   */
  getAppointments(appointmentParams?: AppointmentParams): Observable<ApiResponse<Appointment[]>> {
    return Observable.of({ response: [] });
  }

  /**
   * Get appointment preview. The stylist must be already authenticated as a user.
   */
  getAppointmentPreview(data: AppointmentPreviewRequest): Observable<ApiResponse<AppointmentPreviewResponse>> {
    return Observable.of({
      response: {
        duration_minutes: 0,
        grand_total: 0,
        total_client_price_before_tax: 0,
        total_tax: 0,
        total_card_fee: 0,
        services: []
      }
    });
  }

  /**
   * Creates new appointment. The stylist must be already authenticated as a user.
   */
  createAppointment(data: NewAppointmentRequest, forced: boolean, options: ApiRequestOptions): Observable<ApiResponse<Appointment>> {
    return this.getAppointmentById('');
  }

  /**
   * Get appointment by id. The stylist must be already authenticated as a user.
   */
  getAppointmentById(appointmentUuid: string): Observable<ApiResponse<Appointment>> {
    return Observable.of({
      response: {
        uuid: 'string',
        client_first_name: 'string',
        client_last_name: 'string',
        client_phone: 'string',
        total_client_price_before_tax: 0,
        total_tax: 0,
        total_card_fee: 0,
        has_tax_included: false,
        has_card_fee_included: false,
        datetime_start_at: 'string',
        duration_minutes: 0,
        status: AppointmentStatuses.new,
        services: [],
        client_uuid: 'string',
        client_profile_photo_url: 'string',
        grand_total: 0
      }
    });
  }

  /**
   * Change appointment by uuid.
   */
  changeAppointment(appointmentUuid: string, data: AppointmentChangeRequest): Observable<ApiResponse<Appointment>> {
    return this.getAppointmentById('');
  }
}