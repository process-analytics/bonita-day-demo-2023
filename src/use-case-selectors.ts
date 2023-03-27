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

const updateUseCaseSelectorsState = (disable: boolean): void => {
  const radios = document.querySelectorAll<HTMLInputElement>('#control input[type=radio]');
  for (const radio of radios) {
    radio.disabled = disable;
  }
};

export const disableUseCaseSelectors = (): void => {
  updateUseCaseSelectorsState(true);
};

export const enableUseCaseSelectors = (): void => {
  updateUseCaseSelectorsState(false);
};
