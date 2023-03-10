// Initially taken from https://github.com/process-analytics/icpm-demo-2022/blob/v1.0.0/src/happy-path.js

import {type BpmnVisualization} from 'bpmn-visualization';
import {isActivity, isEvent, isGateway} from './bpmn-elements.js';

/* Start event --> SRM subprocess
  --> vendor creates order item --> create purchase order item
  --> Record goods receipt --> record invoice receipt --> clear invoice
  --> end event */
const happyPath = [
  'Event_1vogvxc',
  'Flow_0i9hf3x',
  'Gateway_0xh0plz',
  // Activate paths after the first parallel gateway
  'Flow_06ca3ya',
  'Activity_0ec8azh',
  'Flow_169iupn',
  'Event_0e43ncy',
  'Flow_1ojqrz1',
  'Activity_1t65hvk',
  // Activate the path after subprocess
  'Flow_1y1kscn',
  'Gateway_0apcz1e',
  // Record Goods Receipt
  'Flow_1448s6h',
  'Activity_00vbm9s',
  // Gateway after parallel
  'Flow_0j5xinh',
  'Gateway_08gf298',
  // End "Create Purchase Order Item" branch
  'Flow_1a9zw3d',
  // End "Service Entry Sheet Needed?" branch
  'Flow_0wd8pwa',
  'Gateway_0jqn9hp',
  'Flow_1nxinu7',
  // End "Vendor Create Invoice" branch
  'Flow_0hpz0ab',
  // End "Record Goods Receipts" branch
  'Flow_14tr1q9',
  // Finalize the Subprocess path
  'Gateway_01gpztl',
  'Flow_19cdedl',
  // Finalize the 1st part of the path
  'Gateway_0domayw',
  // Last path elements
  'Flow_06uo70h',
  'Activity_1u4jwkv',
  'Flow_0lrixjg',
  'Gateway_0a68dfj',
  'Flow_1lkft1n',
  'Gateway_1ezcj46',
  'Flow_1kkicvr',
  'Activity_0yabbur',
  'Flow_12q12yb',
  'Event_07598zy',
];

const happyPathElementWithOverlays = 'Event_1vogvxc';

const speedFactor = 1; // For now, it is only used while debugging to accelerate the animation. In the future, it could be used to let user choose the animation speed.
const animationDuration = speedFactor;
const animationDurationOfEdgeArrow = 0.3 * speedFactor;

const animationDelay = animationDuration / 2;
const animationDurationOfEdgeLine = animationDuration - animationDurationOfEdgeArrow;

function getHappyPathClasses(index: number, elementId: string) {
  const delay = index * animationDelay;

  let classToAdd;
  let styleInnerHtml;
  if (isActivity(elementId)) {
    styleInnerHtml = `.animate-${elementId} > rect { animation-delay: ${delay}s; animation-duration: ${animationDuration}s; }`;
    classToAdd = 'pulse-happy';
  } else if (isEvent(elementId)) {
    styleInnerHtml = `.animate-${elementId} > ellipse { animation-delay: ${delay}s; animation-duration: ${animationDuration}s; }`;
    classToAdd = 'pulse-happy';
  } else if (isGateway(elementId)) {
    styleInnerHtml = `.animate-${elementId} > path { animation-delay: ${delay}s; animation-duration: ${animationDuration}s; }`;
    classToAdd = 'gateway-happy';
  } else {
    // Flow
    styleInnerHtml
        = `.animate-${elementId} > path:nth-child(2) { animation-delay: ${delay}s; animation-duration: ${animationDurationOfEdgeLine}s; }
.animate-${elementId} > path:nth-child(3) { animation-delay: ${delay + (animationDurationOfEdgeLine / 2)}s; animation-duration: ${animationDurationOfEdgeArrow}s; }`;
    classToAdd = 'growing-happy';
  }

  return {classToAdd, styleInnerHtml};
}

export function showHappyPath(bpmnVisualization: BpmnVisualization) {
  const headElt = document.querySelectorAll('head')[0];

  /* Iterate over the elements in the happyPath
   apply css and add a delay so that we see the css applied in a sequential manner */
  for (const [index, elementId] of happyPath.entries()) {
    const {classToAdd, styleInnerHtml} = getHappyPathClasses(index, elementId);

    const style = document.createElement('style');
    style.id = elementId;
    style.type = 'text/css';
    style.innerHTML = styleInnerHtml;
    headElt.append(style);

    bpmnVisualization.bpmnElementsRegistry.addCssClasses(elementId, [classToAdd, `animate-${elementId}`]);
  }

  bpmnVisualization.bpmnElementsRegistry.addOverlays(
    happyPathElementWithOverlays,
    {
      position: 'top-center',
      label: '45 traces \n (7.36%) \n ??? 2.08 months',
      style: {
        font: {color: 'green', size: 14},
        fill: {color: 'White', opacity: 40},
        stroke: {color: 'black', width: 0},
      },
    },
  );
}

export function hideHappyPath(bpmnVisualization: BpmnVisualization) {
  bpmnVisualization.bpmnElementsRegistry.removeCssClasses(happyPath, [
    'highlight-happy-path',
    'pulse-happy',
    'gateway-happy',
    'growing-happy',
    ...happyPath.map(elementId => {
      const styleOfElement = document.querySelector(`#${elementId}`);
      styleOfElement?.parentNode?.removeChild(styleOfElement);
      return `animate-${elementId}`;
    }),
  ]);

  bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(
    happyPathElementWithOverlays,
  );
}
