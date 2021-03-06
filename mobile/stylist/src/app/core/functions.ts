import { Page } from 'ionic-angular/navigation/nav-util';
import { App } from 'ionic-angular';

import { UserRole } from '~/shared/api/auth.models';
import { StylistProfileStatus } from '~/shared/api/stylist-app.models';
import { PushPrimingScreenParams } from '~/shared/components/push-priming-screen/push-priming-screen.component';
import { PushNotification } from '~/shared/push/push-notification';

import { AppModule } from '~/app.module';
import { PageNames } from '~/core/page-names';
import { FieldEditComponentParams } from '~/onboarding/field-edit/field-edit.component';
import { RegistrationFormControl } from '~/onboarding/registration.form';

export interface PageDescr {
  page: Page;
  params?: any;
}

/**
 * Determines what page to show after auth based on the completeness
 * of the profile of the user. Also calculates the natural navigation
 * history for that page and returns the full list of pages that should
 * be set as navigation history. The last item in this list is the page
 * to show.
 * @param profileStatus as returned by auth.
 */
export async function createNavHistoryList(profileStatus: StylistProfileStatus): Promise<PageDescr[]> {
  const pages: PageDescr[] = [];

  // If we are restoring a navigation then the list should start with FirstScreen
  // so that you can navigate all way back to it.
  pages.push({ page: PageNames.FirstScreen });

  const fieldEditParams: FieldEditComponentParams = { control: RegistrationFormControl.FirstName };
  pages.push({ page: PageNames.FieldEdit, params: { params: fieldEditParams } });

  if (!profileStatus) {
    // No profile at all, start from beginning.
    return pages;
  }

  if (!profileStatus.has_personal_data) {
    return pages;
  }

  return [
    await nextToShowForCompleteProfile()
  ];
}

export async function nextToShowForCompleteProfile(): Promise<PageDescr> {
  const pushNotification = AppModule.injector.get(PushNotification);

  // The only remaining optional screen is push priming screen. Check if need to show it.
  if (await pushNotification.needToShowPermissionScreen()) {
    // Yes, we need to show it. Do it.

    const pushParams: PushPrimingScreenParams = {
      appType: UserRole.stylist,
      // Show next appropriate screen after PushPrimingScreen
      onContinue: async () => {
        const app = AppModule.injector.get(App);
        app.getRootNav().setRoot(PageNames.HomeSlots);
      }
    };
    return { page: PageNames.PushPrimingScreen, params: { params: pushParams } };
  }

  // Show home screen
  return { page: PageNames.HomeSlots };
}

/**
 * Perform one-level deep comparison of arrays
 */
export function arrayEqual(a1: any[], a2: any[]): boolean {
  if (a1.length !== a2.length) {
    return false;
  }

  for (let i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) {
      return false;
    }
  }

  return true;
}
