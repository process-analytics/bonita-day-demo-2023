/*
Copyright 2023 Bonitasoft S.A.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {Notyf} from 'notyf';

// To improve, we may use existing libraries like the ones listed in https://geshan.com.np/blog/2022/08/javascript-wait-1-second/
export const delay = async (ms: number, args?: any) =>
// eslint-disable-next-line no-promise-executor-return -- cannot be managed now
  new Promise(timeup => setTimeout(timeup, ms, args));

// Notification configuration

export enum NotyfType {
  Success = 'success',
  Warning = 'warning',
}

export function configureToast(notyfDuration: number) {
  return new Notyf({
    position: {
      x: 'center',
      y: 'top',
    },
    types: [
      {
        type: NotyfType.Success,
        duration: notyfDuration,
      },
      {
        type: NotyfType.Warning,
        duration: notyfDuration,
        background: '#ff8c00',
        icon: false,
      },
    ],
  });
}

export function toast(notyf: Notyf, type: string, htmlMessage: string) {
  notyf.open({
    type,
    message: htmlMessage,
  });
}

