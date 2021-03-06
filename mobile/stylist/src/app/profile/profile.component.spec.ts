import { ComponentFixture } from '@angular/core/testing';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { Camera } from '@ionic-native/camera';
import { ActionSheetController, ModalController } from 'ionic-angular';
import { AgmCoreModule, MapsAPILoader } from '@agm/core';
import { LaunchNavigator } from '@ionic-native/launch-navigator';

import { Logger } from '~/shared/logger';
import { ServerStatusTracker } from '~/shared/server-status-tracker';
import { ProfileDataStore } from '~/core/profile.data';
import { prepareSharedObjectsForTests } from '~/core/test-utils.spec';
import { TestUtils } from '../../test';
import { ProfileComponent, ProfileTabNames } from './profile.component';
import { getPhoneNumber } from '~/shared/utils/phone-numbers';
import { calcProfileCompleteness } from '~/core/utils/stylist-utils';
import { PageNames } from '~/core/page-names';
import { StylistServiceMock } from '~/core/api/stylist.service.mock';
import { StylistServiceProvider } from '~/core/api/stylist.service';
import { StylistProfileApi } from '~/shared/api/stylist-profile.api';
import { StylistProfileApiMock } from '~/shared/api/stylist-profile.api.mock';

let fixture: ComponentFixture<ProfileComponent>;
let instance: ProfileComponent;

describe('Pages: ProfileComponent', async () => {
  prepareSharedObjectsForTests();

  // TestBed.createComponent(ProfileComponent) inside
  // see https://angular.io/guide/testing#component-class-testing for more info
  beforeEach(async () => TestUtils.beforeEachCompiler(
    [
      ProfileComponent
    ], [
      MapsAPILoader,
      HttpClient,
      HttpHandler,
      Logger,
      ServerStatusTracker,
      Camera,
      ActionSheetController,
      LaunchNavigator,
      ProfileDataStore,
      StylistServiceMock,
      StylistProfileApiMock,
      ModalController
    ], [AgmCoreModule])
    .then(async (compiled) => {
      fixture = compiled.fixture; // https://angular.io/api/core/testing/ComponentFixture
      instance = compiled.instance;
      instance.ionViewWillEnter();

      const stylistServiceProvider = fixture.debugElement.injector.get(StylistServiceProvider);
      const stylistServiceMock = fixture.debugElement.injector.get(StylistServiceMock);
      spyOn(stylistServiceProvider, 'getProfile').and.returnValue(
        stylistServiceMock.getProfile()
      );

      const stylistProfileApi = fixture.debugElement.injector.get(StylistProfileApi);
      const stylistProfileApiMock = fixture.debugElement.injector.get(StylistProfileApiMock);
      spyOn(stylistProfileApi, 'getClientsFeedBack').and.returnValue(
        stylistProfileApiMock.getClientsFeedBack()
      );
      spyOn(stylistProfileApi, 'getStylistProfile').and.returnValue(
        stylistProfileApiMock.getStylistProfile()
      );

      const stylistProfileApiRes = await stylistServiceMock.getProfile().get();

      if (stylistProfileApiRes.response) {
        instance.profile = stylistProfileApiRes.response;
        instance.profile.phone = getPhoneNumber(instance.profile.phone);
        instance.profile.public_phone = getPhoneNumber(instance.profile.public_phone);

        instance.stylistProfileCompleteness = calcProfileCompleteness(instance.profile);
      }


      const stylistProfileResponse = await stylistProfileApiMock.getStylistProfile().get();
      if (stylistProfileResponse.response) {
        instance.stylistProfile = stylistProfileResponse.response;
      }

      fixture.detectChanges();
    })
  );

  it('should create the page', () => {
    expect(instance)
      .toBeTruthy();
  });

  it('should have two tabs', () => {
    const profileTabs = fixture.nativeElement.querySelector('[data-test-id=profileTabs]');
    expect(profileTabs.innerText).toContain(ProfileTabNames.edit);
    expect(profileTabs.innerText).toContain(ProfileTabNames.clientView);
  });

  it('should have not a complete profile', () => {
    instance.stylistProfileCompleteness = calcProfileCompleteness(instance.profile);
    expect(instance.stylistProfileCompleteness.isProfileComplete).toBe(false);

    const isProfileComplete = fixture.nativeElement.querySelector('[data-test-id=isProfileComplete]');
    expect(isProfileComplete).toBeDefined();

    const completenessPercent = fixture.nativeElement.querySelector('[data-test-id=completenessPercent]');
    expect(completenessPercent.innerText).toContain(instance.stylistProfileCompleteness.completenessPercent);
  });

  it('should show all data set', () => {
    const stylistProfilePreviewName = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewName]');
    expect(stylistProfilePreviewName.innerText).toContain(instance.profile.first_name);

    const stylistProfilePreviewSalon = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewSalon]');
    expect(stylistProfilePreviewSalon.innerText).toContain(instance.profile.salon_name);

    const stylistProfilePreviewClients = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewClients]');
    expect(stylistProfilePreviewClients.innerText).toContain(instance.profile.followers_count);

    const stylistProfilePreviewAddress = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewAddress]');
    expect(stylistProfilePreviewAddress.innerText).toContain(instance.profile.salon_address);

    const stylistProfilePreviewWebsite = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewWebsite]');
    expect(stylistProfilePreviewWebsite.innerText).toContain(instance.profile.website_url);

    const stylistProfilePreviewEmail = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewEmail]');
    expect(stylistProfilePreviewEmail.innerText).toContain(instance.profile.email);

    const stylistProfilePreviewPhone = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewPhone]');
    expect(stylistProfilePreviewPhone.innerText).toContain(instance.profile.phone);
  });

  xit('should be able to click and edit on not filled field', () => {
    instance.activeTab = ProfileTabNames.clientView;
    fixture.detectChanges();
    spyOn(instance, 'onFieldEdit');
    spyOn(instance, 'onAddPhoto');

    instance.profile.profile_photo_url = '';
    fixture.detectChanges();
    const stylistProfilePreviewPhoto = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewPhoto]');
    stylistProfilePreviewPhoto.click();
    expect(instance.onAddPhoto).toHaveBeenCalled();

    instance.profile.instagram_url = '';
    fixture.detectChanges();
    const stylistProfilePreviewInstagram = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewInstagram]');
    stylistProfilePreviewInstagram.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('instagram_url');

    instance.profile.website_url = '';
    fixture.detectChanges();
    const stylistProfilePreviewWebsite = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewWebsite]');
    stylistProfilePreviewWebsite.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('website_url');

    instance.profile.email = '';
    fixture.detectChanges();
    const stylistProfilePreviewEmail = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewEmail]');
    stylistProfilePreviewEmail.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('email');
  });

  xit('should be able to click followers and move to followers page', () => {
    spyOn(instance, 'onMyClientsClick');

    const stylistProfilePreviewClients = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreviewClients]');
    stylistProfilePreviewClients.click();
    expect(instance.onMyClientsClick).toHaveBeenCalled();
  });

  it('should have not set Account Info', () => {
    instance.activeTab = ProfileTabNames.edit;
    fixture.detectChanges();

    const ProfileEditAccountInfoHours = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoHours]');
    const ProfileEditAccountInfoHoursImg = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoHours] img');
    expect(ProfileEditAccountInfoHours.innerText).toContain('Hours');
    expect(ProfileEditAccountInfoHours.innerText).toContain('Add Info');
    expect(ProfileEditAccountInfoHoursImg).toBeDefined();

    const ProfileEditAccountInfoService = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoService]');
    const ProfileEditAccountInfoServiceImg = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoService] img');
    expect(ProfileEditAccountInfoService.innerText).toContain('Service');
    expect(ProfileEditAccountInfoService.innerText).toContain('Add Info');
    expect(ProfileEditAccountInfoServiceImg).toBeDefined();

    const ProfileEditAccountInfoDiscounts = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoDiscounts]');
    const ProfileEditAccountInfoDiscountsImg = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoDiscounts] img');
    expect(ProfileEditAccountInfoDiscounts.innerText).toContain('Discounts');
    expect(ProfileEditAccountInfoDiscounts.innerText).toContain('Add Info');
    expect(ProfileEditAccountInfoDiscountsImg).toBeDefined();
  });

  it('should have set Account Info', () => {
    instance.activeTab = ProfileTabNames.edit;

    instance.profile.profile_status = {
      has_business_hours_set: true,
      has_invited_clients: true,
      has_other_discounts_set: true,
      has_personal_data: true,
      has_picture_set: true,
      has_services_set: true,
      has_weekday_discounts_set: true,
      must_select_deal_of_week: false,
      can_checkout_with_made: true,
      google_calendar_integrated: true
    };

    instance.stylistProfileCompleteness = calcProfileCompleteness(instance.profile);

    fixture.detectChanges();

    const ProfileEditAccountInfoHours = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoHours]');
    const ProfileEditAccountInfoHoursImg = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoHours] img');
    expect(ProfileEditAccountInfoHours.innerText).toContain('Hours');
    expect(ProfileEditAccountInfoHours.innerText).toContain('Complete');
    expect(ProfileEditAccountInfoHoursImg).toBeNull();

    const ProfileEditAccountInfoService = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoService]');
    const ProfileEditAccountInfoServiceImg = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoService] img');
    expect(ProfileEditAccountInfoService.innerText).toContain('Service');
    expect(ProfileEditAccountInfoService.innerText).toContain('Complete');
    expect(ProfileEditAccountInfoServiceImg).toBeNull();

    const ProfileEditAccountInfoDiscounts = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoDiscounts]');
    const ProfileEditAccountInfoDiscountsImg = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoDiscounts] img');
    expect(ProfileEditAccountInfoDiscounts.innerText).toContain('Discounts');
    expect(ProfileEditAccountInfoDiscounts.innerText).toContain('Complete');
    expect(ProfileEditAccountInfoDiscountsImg).toBeNull();
  });

  xit('should be able to edit Account Info field', () => {
    instance.activeTab = ProfileTabNames.edit;
    instance.servicesPage = PageNames.ServicesList;
    fixture.detectChanges();

    spyOn(instance, 'onSetAccountInfo');

    const ProfileEditAccountInfoHours = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoHours]');
    ProfileEditAccountInfoHours.click();
    expect(instance.onSetAccountInfo).toHaveBeenCalledWith(PageNames.WorkHours);

    const ProfileEditAccountInfoService = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoService]');
    ProfileEditAccountInfoService.click();
    expect(instance.onSetAccountInfo).toHaveBeenCalledWith(instance.servicesPage);

    const ProfileEditAccountInfoDiscounts = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAccountInfoDiscounts]');
    ProfileEditAccountInfoDiscounts.click();
    expect(instance.onSetAccountInfo).toHaveBeenCalledWith(PageNames.Discounts);
  });

  xit('should be able to click and edit on editable fields in edit tab', () => {
    instance.activeTab = ProfileTabNames.edit;
    fixture.detectChanges();

    spyOn(instance, 'onFieldEdit');
    spyOn(instance, 'onAddPhoto');

    const ProfileEditPhoto = fixture.nativeElement.querySelector('[data-test-id=ProfileEditPhoto]');
    ProfileEditPhoto.click();
    expect(instance.onAddPhoto).toHaveBeenCalled();

    const ProfileEditInstagram = fixture.nativeElement.querySelector('[data-test-id=ProfileEditInstagram]');
    ProfileEditInstagram.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('instagram_url');

    const ProfileEditName = fixture.nativeElement.querySelector('[data-test-id=ProfileEditName]');
    ProfileEditName.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('first_name');

    const ProfileEditSalonName = fixture.nativeElement.querySelector('[data-test-id=ProfileEditSalonName]');
    ProfileEditSalonName.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('salon_name');

    const ProfileEditAddress = fixture.nativeElement.querySelector('[data-test-id=ProfileEditAddress]');
    ProfileEditAddress.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('salon_address');

    const ProfileEditEmail = fixture.nativeElement.querySelector('[data-test-id=ProfileEditEmail]');
    ProfileEditEmail.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('email');

    const ProfileEditWebsite = fixture.nativeElement.querySelector('[data-test-id=ProfileEditWebsite]');
    ProfileEditWebsite.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('website_url');

    const ProfileEditPublicPhone = fixture.nativeElement.querySelector('[data-test-id=ProfileEditPublicPhone]');
    ProfileEditPublicPhone.click();
    expect(instance.onFieldEdit).toHaveBeenCalledWith('public_phone');
  });

  it('should not be able to click and edit on Phone', () => {
    instance.activeTab = ProfileTabNames.edit;
    fixture.detectChanges();

    spyOn(instance, 'onFieldEdit');

    const ProfileEditPhone = fixture.nativeElement.querySelector('[data-test-id=ProfileEditPhone]');
    ProfileEditPhone.click();
    expect(instance.onFieldEdit).not.toHaveBeenCalled();
  });

  xit('should have rating percentage and user comments', () => {
    const stylistProfilePreview_MadeThumb = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreview_MadeThumb]');
    expect(stylistProfilePreview_MadeThumb.innerText).toContain(instance.stylistProfile.rating_percentage);

    const stylistProfilePreview_MadeUserComment = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreview_MadeUserComment]');
    expect(stylistProfilePreview_MadeUserComment.innerText).toContain(instance.stylistRating[0].comment);
    expect(stylistProfilePreview_MadeUserComment.innerText).toContain(instance.stylistRating[1].comment);
  });

  it('should see set services box if services is not set yet', () => {
    fixture.detectChanges();

    const stylistProfilePreview_viewable = fixture.nativeElement.querySelector('[data-test-id=stylistProfilePreview_viewable]');
    expect(stylistProfilePreview_viewable).toBeDefined();
  });
});
