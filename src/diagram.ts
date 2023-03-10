import {BpmnVisualization, FitType} from 'bpmn-visualization';
// eslint-disable-next-line n/file-extension-in-import -- Vite syntax
import subDiagram from './diagrams/SRM-subprocess.bpmn?raw';
import {removeSectionInBreadcrumb, addSectionInBreadcrumb} from './breadcrumb.js';

let secondaryBpmnDiagramIsAlreadyLoad = false;
let currentView = 'main';

// Secondary BPMN Container
const secondaryBpmnVisualization = new BpmnVisualization({container: 'secondary-bpmn-container'});

export function loadBpmnDiagram(tabIndex: string): void {
  if (currentView === tabIndex) {
    return;
  }

  const mainBpmnContainerElt = document.querySelector('#main-bpmn-container')!;
  const secondaryBpmnContainerElt = document.querySelector('#secondary-bpmn-container')!;

  switch (tabIndex) {
    case 'secondary': {
      addSectionInBreadcrumb();
      mainBpmnContainerElt.classList.add('d-hide');
      secondaryBpmnContainerElt.classList.remove('d-hide');

      if (!secondaryBpmnDiagramIsAlreadyLoad) {
        // Load secondary diagram. Need to have the container displayed
        secondaryBpmnVisualization.load(subDiagram, {fit: {type: FitType.Center, margin: 10}});
        secondaryBpmnDiagramIsAlreadyLoad = true;
      }

      break;
    }

    default: {
      removeSectionInBreadcrumb();
      mainBpmnContainerElt.classList.remove('d-hide');
      secondaryBpmnContainerElt.classList.add('d-hide');
      break;
    }
  }

  currentView = tabIndex;
}
