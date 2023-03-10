// Remove section of secondary diagram in Breadcrumb
export function removeSectionInBreadcrumb(): void {
    const breadcrumbElt = document.getElementsByClassName('breadcrumb').item(0);
    if (breadcrumbElt) {
        const secondaryDiagramElt = document.getElementById('secondary-diagram');
        if (secondaryDiagramElt) {
            breadcrumbElt.removeChild(secondaryDiagramElt);
        }
    }
}

// Add section of secondary diagram in Breadcrumb
export function addSectionInBreadcrumb(): void {
    const aElt = document.createElement('a');
    aElt.setAttribute('href', '#');
    aElt.appendChild(document.createTextNode('SRM subprocess'));

    const liElt = document.createElement('li');
    liElt.setAttribute('id', 'secondary-diagram');
    liElt.setAttribute('class', 'breadcrumb-item');
    liElt.appendChild(aElt);

    const breadcrumbElt = document.getElementsByClassName("breadcrumb").item(0);
    if (breadcrumbElt) {
        breadcrumbElt.appendChild(liElt);
    }
}