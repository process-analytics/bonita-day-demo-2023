// Remove section of secondary diagram in Breadcrumb
export function removeSectionInBreadcrumb(): void {
  const breadcrumbElt = document.querySelectorAll('.breadcrumb').item(0);
  if (breadcrumbElt) {
    const secondaryDiagramElt = document.querySelector('#secondary-diagram');
    if (secondaryDiagramElt) {
      secondaryDiagramElt.remove();
    }
  }
}

// Add section of secondary diagram in Breadcrumb
export function addSectionInBreadcrumb(): void {
  const aElt = document.createElement('a');
  aElt.setAttribute('href', '#');
  aElt.append(document.createTextNode('SRM subprocess'));

  const liElt = document.createElement('li');
  liElt.setAttribute('id', 'secondary-diagram');
  liElt.setAttribute('class', 'breadcrumb-item');
  liElt.append(aElt);

  const breadcrumbElt = document.querySelectorAll('.breadcrumb').item(0);
  if (breadcrumbElt) {
    breadcrumbElt.append(liElt);
  }
}
