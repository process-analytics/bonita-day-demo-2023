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
export const delay = async (ms: number, arguments_?: any) =>
// eslint-disable-next-line no-promise-executor-return -- cannot be managed now
  new Promise(resolve => setTimeout(resolve, ms, arguments_));

// Notification configuration
export type NotificationType = 'success' | 'warning';

export class Notification {
  private readonly notyf: Notyf;

  constructor(duration: number) {
    this.notyf = new Notyf({
      position: {
        x: 'center',
        y: 'top',
      },
      types: [
        {
          type: 'success' as NotificationType,
          duration,
        },
        {
          type: 'warning' as NotificationType,
          duration,
          background: '#ff8c00',
          icon: false,
        },
      ],
    });
  }

  toast(type: NotificationType, htmlMessage: string) {
    this.notyf.open({
      type,
      message: htmlMessage,
    });
  }
}
