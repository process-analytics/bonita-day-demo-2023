import {displayView} from './diagram.js';

export const configureBreadcrumb = (): void => {
  document.querySelector('#breadcrumb-main-diagram')!.addEventListener('click', () => {
    displayView('main');
  });
};

export function removeSectionInBreadcrumb(): void {
  const breadcrumbElt = document.querySelectorAll('.breadcrumb > #sub-process-diagram').item(0);
  breadcrumbElt?.remove();
}

export function addSectionInBreadcrumb(): void {
  const breadcrumbElt = document.querySelectorAll('.breadcrumb').item(0);
  if (!breadcrumbElt) {
    return;
  }

  const aElt = document.createElement('a');
  aElt.setAttribute('href', '#');
  aElt.append(document.createTextNode('SRM subprocess'));

  const liElt = document.createElement('li');
  liElt.setAttribute('id', 'sub-process-diagram');
  liElt.setAttribute('class', 'breadcrumb-item');
  liElt.append(aElt);

  breadcrumbElt.append(liElt);
}
