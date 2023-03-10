import {BpmnVisualization, FitType} from 'bpmn-visualization';
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import subDiagram from './diagrams/SRM-subprocess.bpmn?raw';
import {removeSectionInBreadcrumb, addSectionInBreadcrumb} from './breadcrumb';

let secondaryBpmnDiagramIsAlreadyLoad = false;
let currentView = 'main';

// Secondary BPMN Container
const secondaryBpmnVisualization = new BpmnVisualization({container: 'secondary-bpmn-container'});

export function loadBpmnDiagram(tabIndex: string): void {
  if (currentView === tabIndex) {
    return;
  }

  const mainBPMNContainerElt = document.querySelector('#main-bpmn-container')!;
  const secondaryBPMNContainerElt = document.querySelector('#secondary-bpmn-container')!;

  switch (tabIndex) {
    case 'main': {
      removeSectionInBreadcrumb();
      mainBPMNContainerElt.classList.remove('d-hide');
      secondaryBPMNContainerElt.classList.add('d-hide');
      break;
    }

    case 'secondary': {
      addSectionInBreadcrumb();
      mainBPMNContainerElt.classList.add('d-hide');
      secondaryBPMNContainerElt.classList.remove('d-hide');

      if (!secondaryBpmnDiagramIsAlreadyLoad) {
        // Load secondary diagram. Need to have the container displayed
        secondaryBpmnVisualization.load(subDiagram, {fit: {type: FitType.Center, margin: 10}});
        secondaryBpmnDiagramIsAlreadyLoad = true;
      }

      break;
    }
  }

  currentView = tabIndex;
}
