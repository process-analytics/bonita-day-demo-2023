import {displayView} from './diagram.js';

export const configureBreadcrumb = (): void => {
  document.querySelector('#breadcrumb-main-diagram')!.addEventListener('click', () => {
    displayView('main');
  });
};

// Remove section of secondary diagram in Breadcrumb
export function removeSectionInBreadcrumb(): void {
  const secondaryDiagramElt = document.querySelectorAll('.breadcrumb > #secondary-diagram').item(0);
  secondaryDiagramElt?.remove();
}

// Add section of secondary diagram in Breadcrumb
export function addSectionInBreadcrumb(): void {
  const breadcrumbElt = document.querySelectorAll('.breadcrumb').item(0);
  if (!breadcrumbElt) {
    return;
  }

  const aElt = document.createElement('a');
  aElt.setAttribute('href', '#');
  aElt.append(document.createTextNode('SRM subprocess'));

  const liElt = document.createElement('li');
  liElt.setAttribute('id', 'secondary-diagram');
  liElt.setAttribute('class', 'breadcrumb-item');
  liElt.append(aElt);

  breadcrumbElt.append(liElt);
}
