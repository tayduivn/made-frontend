import { $ } from 'protractor';

import { waitForNot, waitFor } from './utils';

/**
 * LoginRegister page definition
 */
class PhoneLoginPage {
  // UI element declarations.
  get phoneInput() { return $('page-auth-start input[type=tel]'); }
  get continueBtn() { return $('page-auth-start button[type=submit]'); }

  // Operations
  async login(phone) {
    await waitFor(this.phoneInput);
    await this.phoneInput.sendKeys(phone);
    await this.continueBtn.click();
    await waitForNot(this.phoneInput);
  }
}

export const phoneLoginPage = new PhoneLoginPage();
