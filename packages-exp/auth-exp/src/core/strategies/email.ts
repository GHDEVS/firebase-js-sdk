/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as externs from '@firebase/auth-types-exp';
import { ActionCodeSettings } from '@firebase/auth-types-exp';

import { createAuthUri, CreateAuthUriRequest } from '../../api/authentication/create_auth_uri';
import * as api from '../../api/authentication/email_and_password';
import { Operation } from '../../model/action_code_info';
import { Auth } from '../../model/auth';
import { User } from '../../model/user';
import { _getCurrentUrl, _isHttpOrHttps } from '../util/location';
import { setActionCodeSettingsOnRequest } from './action_code_settings';

export async function fetchSignInMethodsForEmail(
  auth: externs.Auth,
  email: string
): Promise<string[]> {
  // createAuthUri returns an error if continue URI is not http or https.
  // For environments like Cordova, Chrome extensions, native frameworks, file
  // systems, etc, use http://localhost as continue URL.
  const continueUri = _isHttpOrHttps() ? _getCurrentUrl() : 'http://localhost';
  const request: CreateAuthUriRequest = {
    identifier: email,
    continueUri
  };

  const { signinMethods } = await createAuthUri(auth as Auth, request);

  return signinMethods || [];
}

export async function sendEmailVerification(
  auth: externs.Auth,
  user: User,
  actionCodeSettings?: ActionCodeSettings
): Promise<void> {
  const idToken = await user.getIdToken();
  const request: api.VerifyEmailRequest = {
    requestType: Operation.VERIFY_EMAIL,
    idToken
  };
  if (actionCodeSettings) {
    setActionCodeSettingsOnRequest(request, actionCodeSettings);
  }

  const { email } = await api.sendEmailVerification(auth as Auth, request);

  if (email !== user.email) {
    await user.reload();
  }
}
