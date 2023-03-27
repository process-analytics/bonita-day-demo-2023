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

import {type BpmnVisualization, type ShapeStyleUpdate} from 'bpmn-visualization';
import {delay} from '../utils/shared.js';

function logProcessExecution(message: string, ...optionalParameters: any[]): void {
  console.info(`[EXEC] ${message}`, ...optionalParameters);
}

const executionDurationEdge = 200; // 500;
const executionDurationShapeDefault = 300; // 1_000;

// =====================================================================================================================
// extract all data code following this line
// =====================================================================================================================

const executionSteps = new Map<string, ExecutionStep>([
// Event_1t5st9j start event
  ['Event_1t5st9j', {id: 'Event_1t5st9j', nextExecutionStep: 'Gateway_19radi6'}],
  // Gateway_19radi6 merge start and loop
  ['Gateway_19radi6', {id: 'Gateway_19radi6', incomingEdgeId: 'Flow_0i8gykc', nextExecutionStep: 'Activity_04d6t36'}],
  // Activity_04d6t36 chatGPT activity
  ['Activity_04d6t36', {id: 'Activity_04d6t36', incomingEdgeId: 'Flow_06y94ol',
    innerAction: {
      functionToCall() {
        console.info('#### action on Activity_04d6t36');
      },
      getElementIdToResume(_input) {
        return 'Activity_1oxewnq';
      },
    },
  }],
  // Activity_1oxewnq review email. Stop here, next step chosen by user
  ['Activity_1oxewnq', {id: 'Activity_1oxewnq', incomingEdgeId: 'Flow_092it75',
    innerAction: {
      functionToCall() {
        console.info('#### action on Activity_1oxewnq');
      },
      getElementIdToResume(input) {
        return getExecutionStepAfterReviewEmailChoice(input as ReviewEmailDecision);
      },
    },
  }],

  // After email review
  // Event_13tn0ty abort
  ['Event_13tn0ty', {id: 'Event_13tn0ty', incomingEdgeId: 'Flow_1b13tzq', isLastStep: true}],
  // Activity_0tb47yw "Send email to client"
  ['Activity_0tb47yw', {id: 'Activity_0tb47yw', incomingEdgeId: 'Flow_1b8bdo1', nextExecutionStep: 'Event_07kw4ry'}],
  // Event_07kw4ry email sent
  ['Event_07kw4ry', {id: 'Event_07kw4ry', incomingEdgeId: 'Flow_1jay9w3', isLastStep: true}],
]);

export type ReviewEmailDecision = 'abort' | 'generate' | 'validate';
const reviewEmailChoices = new Map<ReviewEmailDecision, string | ExecutionStep>([
  ['validate', 'Activity_0tb47yw'],
  // ExecutionStep to manage the loop, as the gateway has more than one incoming edge
  ['generate', {id: 'Gateway_19radi6', incomingEdgeId: 'Flow_1glx5xw', nextExecutionStep: 'Activity_04d6t36', incomingEdgeDisplayExecutionCount: true}],
  ['abort', 'Event_13tn0ty'],
]);

const getExecutionStepAfterReviewEmailChoice = (decision: ReviewEmailDecision): ExecutionStep => {
  const nextExecutionStep = reviewEmailChoices.get(decision);
  return {id: 'Gateway_0ng9ln7', incomingEdgeId: 'Flow_0adzt76', nextExecutionStep};
};

// =====================================================================================================================
// END OF - extract all data code following this line
// =====================================================================================================================

type ExecutionStep = {
  id: string;
  /** In milliseconds, override the default duration set for the shape or the edge. */
  duration?: number;
  incomingEdgeId?: string;
  incomingEdgeDisplayExecutionCount?: boolean;
  nextExecutionStep?: string | ExecutionStep;
  innerAction?: {
    functionToCall: () => void;
    getElementIdToResume: (input?: string) => string | ExecutionStep;
  };
  /** If `true`, call the `onEndCase` callback. */
  isLastStep?: boolean;
};

export type InnerActionParameters = {
  elementId: string;
  executionCount: number;
  resume: (input?: string) => Promise<void>;
};

const processExecutorWaitTimeBeforeCallingEndCaseCallback = 1500;

type MarkExecutionOptions = {
  id: string;
  isEdge: boolean;
  waitDuration: number;
  displayExecutionCounter?: boolean;
  executionCount?: number;
};

// TODO duplication with MarkExecutionOptions
type PathHighlightMarker = {
  id: string;
  isEdge: boolean;
  displayExecutionCounter?: boolean;
  executionCount?: number;
};

export class ProcessExecutor {
  private readonly pathHighlighter: PathHighlighter;

  private readonly executionCounts = new Map<string, number>();

  // EmailRetrievalOperationsCallBack is passed as we cannot get it from the ExecutionStep defined below for now
  constructor(bpmnVisualization: BpmnVisualization, private readonly endCaseCallBack: () => void, private readonly emailRetrievalOperationsCallBack: (parameters: InnerActionParameters) => void) {
    this.pathHighlighter = new PathHighlighter(bpmnVisualization);
  }

  async start() {
    // eslint-disable-next-line no-warning-comments -- cannot be managed now
    // TODO do not hard code, configure it in the execution data
    return this.execute('Event_1t5st9j');
  }

  async execute(executionStepInput: string | ExecutionStep) {
    logProcessExecution('start executing step', executionStepInput);
    const executionStep = typeof executionStepInput === 'string' ? executionSteps.get(executionStepInput) : executionStepInput;
    if (!executionStep) {
      logProcessExecution('No step found!');
      return;
    }

    const markAsExecuted = async (options: MarkExecutionOptions) => Promise.resolve(options)
    // Const markAsExecuted = async (id: string, isEdge: boolean, waitDuration: number) => Promise.resolve(id)
      .then(options => this.pathHighlighter.markAsExecuted(options))
      .then(id => this.markAsExecuted(id))
      .then(async () => delay(options.waitDuration))
      .then(() => {
        logProcessExecution(`end of wait after ${options.id} highlight`);
      });

    // Const mainPromise = Promise.resolve();
    const incomingEdgeId = executionStep.incomingEdgeId;
    if (incomingEdgeId) {
      // Console.info('register edge promiseMarkAsExecuted execution')
      // mainPromise.then(() => markAsExecuted(incomingEdgeId, true, executionDurationEdge));
      // console.info('registered edge promiseMarkAsExecuted execution')
      const promiseMarkAsExecuted = markAsExecuted({
        id: incomingEdgeId,
        isEdge: true,
        waitDuration: executionDurationEdge,
        displayExecutionCounter: executionStep.incomingEdgeDisplayExecutionCount ?? false,
        executionCount: this.getExecutionCount(incomingEdgeId),
      });
      // Const promiseMarkAsExecuted = markAsExecuted(incomingEdgeId, true, executionDurationEdge);
      console.info('await edge promiseMarkAsExecuted execution');
      await promiseMarkAsExecuted;
      console.info('edge promiseMarkAsExecuted execution done');
    }

    // Console.info('register shape promiseMarkAsExecuted execution')
    // mainPromise.then(() =>  markAsExecuted(executionStep.id, false, executionStep.duration ?? executionDurationShapeDefault));
    // console.info('registered shape promiseMarkAsExecuted execution done')
    const elementId = executionStep.id;
    const promiseMarkAsExecuted = markAsExecuted({
      id: elementId,
      isEdge: false,
      waitDuration: executionStep.duration ?? executionDurationShapeDefault,
    });
    // Const promiseMarkAsExecuted = markAsExecuted(elementId, false, executionStep.duration ?? executionDurationShapeDefault);
    console.info('await shape promiseMarkAsExecuted execution');
    await promiseMarkAsExecuted;
    console.info('shape promiseMarkAsExecuted execution done');

    // Console.info('await mainPromise execution')
    // await mainPromise;
    // console.info('mainPromise execution done')

    const innerAction = executionStep.innerAction;
    if (innerAction) {
      Promise.resolve()
        .then(() => {
          innerAction.functionToCall();
        })
        .then(() => {
          // This is a temp implementation, this should be done with innerAction.functionToCall()
          // but this requires to be able to dynamically set the action function which is not possible for now
          // instead, we hard code the action behavior here as we only have 2 different actions to manage.
          const executionCount = this.getExecutionCount(elementId);
          const parameters: InnerActionParameters = {
            elementId,
            executionCount,
            resume: async (input?: string) => this.execute(innerAction.getElementIdToResume(input))
              .catch(error => {
                console.error('Error while resuming from action on element %s', elementId, error);
              }),
          };
          this.emailRetrievalOperationsCallBack(parameters);
        })
        // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
        .finally(() => {
          // Nothing to do
        });
    }

    if (executionStep.nextExecutionStep) {
      logProcessExecution('call execution of next step', executionStep.nextExecutionStep);
      this.execute(executionStep.nextExecutionStep)
      // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
        .finally(() => {
          // Nothing to do
        });
      logProcessExecution('DONE call execution of next step', executionStep.nextExecutionStep);
    } else if (executionStep.isLastStep) {
      logProcessExecution('registering endCaseCallBack call');
      delay(processExecutorWaitTimeBeforeCallingEndCaseCallback)
        .then(() => {
          logProcessExecution('detected as last step, so clearing everything');
          this.clear();
          logProcessExecution('clear done');
        })
        .then(() => {
          logProcessExecution('calling endCaseCallBack');
        })
        .then(() => {
          this.endCaseCallBack?.();
        })
        .then(() => {
          logProcessExecution('endCaseCallBack called');
        },
        )
        // ignored - to be improved see https://typescript-eslint.io/rules/no-floating-promises/
        .finally(() => {
          // Nothing to do
        });
      logProcessExecution('done registering endCaseCallBack call');
    }
  }

  private getExecutionCount(elementId: string): number {
    return this.executionCounts.get(elementId) ?? 0;
  }

  private clear(): void {
    this.pathHighlighter.clear();
    logProcessExecution('execution counts before clear', this.executionCounts);
    this.executionCounts.clear();
  }

  private markAsExecuted(id: string) {
    const count = this.getExecutionCount(id);
    this.executionCounts.set(id, count + 1);
    return id;
  }
}

class PathHighlighter {
  private readonly executedPath = new Set<string>();

  private pastExecutedId: string | undefined;
  private lastExecutedId: string | undefined;
  private readonly executionCounterMap = new Map<string, number>();

  constructor(private readonly bpmnVisualization: BpmnVisualization) {}

  markAsExecuted(marker: PathHighlightMarker) {
    const id = marker.id;
    // MarkAsExecuted(id: string, isEdge = false) {
    if (marker.isEdge) {
      logProcessExecution(`highlighting ${id}`);
      this.bpmnVisualization.bpmnElementsRegistry.updateStyle(id, {
        font: {opacity: 'default'},
        opacity: 'default',
        stroke: {color: 'blue', width: 4},
      });
      logProcessExecution(`done highlight of ${id}`);

      if (marker.displayExecutionCounter) {
        const executionCount = (marker.executionCount ?? 0) + 1;
        this.executionCounterMap.set(id, executionCount);

        // Remove existing overlays
        this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(id);

        // Add overlay
        this.bpmnVisualization.bpmnElementsRegistry.addOverlays(id, {
          position: 'middle',
          label: `${executionCount}`,
          style: {
            font: {color: 'white', size: 22},
            fill: {color: 'blue'},
            stroke: {color: 'blue', width: 2},
          },
        });
      }
    } else {
      logProcessExecution(`highlighting shape ${id}`);
      this.bpmnVisualization.bpmnElementsRegistry.updateStyle(id, {
        fill: {color: 'blue', opacity: 10},
        font: {opacity: 'default'},
        opacity: 'default',
        stroke: {color: 'blue', width: 3},
      } as ShapeStyleUpdate);
      logProcessExecution(`done highlight of shape ${id}`);
    }

    this.executedPath.add(id);

    // Progressively decrease opacity
    if (this.pastExecutedId) {
      logProcessExecution(`highly reducing opacity of ${this.pastExecutedId}`);
      this.bpmnVisualization.bpmnElementsRegistry.updateStyle(this.pastExecutedId, {
        font: {
          opacity: 15, // The global opacity doesn't affect the font opacity, so we must redefine it here :-(
        },
        opacity: 20,
      },
      );
      logProcessExecution(`done highly reduce opacity of ${this.pastExecutedId}`);

      if (this.executionCounterMap.has(this.pastExecutedId)) {
        // Remove existing overlays
        this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(this.pastExecutedId);

        // Add overlay
        this.bpmnVisualization.bpmnElementsRegistry.addOverlays(this.pastExecutedId, {
          position: 'middle',
          label: `${this.executionCounterMap.get(this.pastExecutedId) ?? 0}`,
          style: {
            font: {color: 'white', size: 22},
            fill: {color: 'rgba(0, 0, 255, 0.2)'},
            stroke: {color: 'rgba(0, 0, 255, 0.2)', width: 2},
          },
        });
      }
    }

    this.pastExecutedId = this.lastExecutedId;
    if (this.lastExecutedId) {
      logProcessExecution(`reducing opacity of ${this.lastExecutedId}`);
      this.bpmnVisualization.bpmnElementsRegistry.updateStyle(this.lastExecutedId, {opacity: 50});
      logProcessExecution(`done reduce opacity of ${this.lastExecutedId}`);

      if (this.executionCounterMap.has(this.lastExecutedId)) {
        // Remove existing overlays
        this.bpmnVisualization.bpmnElementsRegistry.removeAllOverlays(this.lastExecutedId);

        // Add overlay
        this.bpmnVisualization.bpmnElementsRegistry.addOverlays(this.lastExecutedId, {
          position: 'middle',
          label: `${this.executionCounterMap.get(this.lastExecutedId) ?? 0}`,
          style: {
            font: {color: 'white', size: 22},
            fill: {color: 'rgba(0, 0, 255, 0.5)'},
            stroke: {color: 'rgba(0, 0, 255, 0.5)', width: 2},
          },
        });
      }
    }

    this.lastExecutedId = id;
    return id;
  }

  clear(): void {
    // Use reset style by property as global reset method isn't available in bpmn-visualization@0.33.0
    this.bpmnVisualization.bpmnElementsRegistry.updateStyle(Array.from(this.executedPath),
      {
        opacity: 'default',
        fill: {
          color: 'default',
          opacity: 'default',
        },
        font: {
          opacity: 'default',
        },
        stroke: {
          color: 'default',
          opacity: 'default',
          width: 'default',
        },
      },
    );
    this.executedPath.clear();
    this.lastExecutedId = undefined;
    this.pastExecutedId = undefined;
  }
}
