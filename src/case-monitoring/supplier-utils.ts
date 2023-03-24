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
    action() {
      console.info('#### action on Activity_04d6t36');
    },
  }],
  // Activity_1oxewnq review email. Stop here, next step chosen by user
  ['Activity_1oxewnq', {id: 'Activity_1oxewnq', incomingEdgeId: 'Flow_092it75',
    action() {
      console.info('#### action on Activity_1oxewnq');
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

export type ReviewEmailDecision = 'abort' | 'regenerate' | 'validated';
const reviewEmailChoices = new Map<ReviewEmailDecision, string | ExecutionStep>([
  ['validated', 'Activity_0tb47yw'],
  // ExecutionStep to manage the loop, as the gateway has more than one incoming edge
  ['regenerate', {id: 'Gateway_19radi6', incomingEdgeId: 'Flow_1glx5xw', nextExecutionStep: 'Activity_04d6t36'}],
  ['abort', 'Event_13tn0ty'],
]);

export const getExecutionStepAfterReviewEmailChoice = (decision: ReviewEmailDecision): ExecutionStep => {
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
  nextExecutionStep?: string | ExecutionStep;
  action?: () => void;
  /** If `true`, call the `onEndCase` callback. */
  isLastStep?: boolean;
};

const processExecutorWaitTimeBeforeCallingEndCaseCallback = 1500;

export class ProcessExecutor {
  private readonly pathHighlighter: PathHighlighter;

  private readonly executionCounts = new Map<string, number>();

  constructor(bpmnVisualization: BpmnVisualization, private readonly endCaseCallBack: () => void, private readonly emailRetrievalOperationsCallBack: (id: string) => void) {
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

    const markAsExecuted = async (id: string, isEdge: boolean, waitDuration: number) => Promise.resolve(id)
      .then(id => this.pathHighlighter.markAsExecuted(id, isEdge))
      .then(id => this.markAsExecuted(id))
      .then(async () => delay(waitDuration))
      .then(() => {
        logProcessExecution(`end of wait after ${id} highlight`);
      });

    // Const mainPromise = Promise.resolve();
    const incomingEdgeId = executionStep.incomingEdgeId;
    if (incomingEdgeId) {
      // Console.info('register edge promiseMarkAsExecuted execution')
      // mainPromise.then(() => markAsExecuted(incomingEdgeId, true, executionDurationEdge));
      // console.info('registered edge promiseMarkAsExecuted execution')
      const promiseMarkAsExecuted = markAsExecuted(incomingEdgeId, true, executionDurationEdge);
      console.info('await edge promiseMarkAsExecuted execution');
      await promiseMarkAsExecuted;
      console.info('edge promiseMarkAsExecuted execution done');
    }

    // Console.info('register shape promiseMarkAsExecuted execution')
    // mainPromise.then(() =>  markAsExecuted(executionStep.id, false, executionStep.duration ?? executionDurationShapeDefault));
    // console.info('registered shape promiseMarkAsExecuted execution done')
    const promiseMarkAsExecuted = markAsExecuted(executionStep.id, false, executionStep.duration ?? executionDurationShapeDefault);
    console.info('await shape promiseMarkAsExecuted execution');
    await promiseMarkAsExecuted;
    console.info('shape promiseMarkAsExecuted execution done');

    // Console.info('await mainPromise execution')
    // await mainPromise;
    // console.info('mainPromise execution done')

    if (executionStep.action) {
      Promise.resolve()
        .then(() => executionStep.action?.())
        .then(() => {
          // This is a temp implementation, this should be done with executionStep.action?.()
          // but this requires to be able to dynamically set the action function which is not possible for now
          // instead, we hard code the action behavior here as we only have 2 different actions to manage.
          this.emailRetrievalOperationsCallBack(executionStep.id);
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

  getExecutionCount(elementId: string) {
    return this.executionCounts.get(elementId);
  }

  private clear(): void {
    this.pathHighlighter.clear();
    logProcessExecution('execution counts before clear', this.executionCounts);
    this.executionCounts.clear();
  }

  private markAsExecuted(id: string) {
    const count = this.executionCounts.get(id) ?? 0;
    this.executionCounts.set(id, count + 1);
    return id;
  }
}

class PathHighlighter {
  private readonly executedPath = new Set<string>();

  private pastExecutedId: string | undefined;
  private lastExecutedId: string | undefined;

  constructor(private readonly bpmnVisualization: BpmnVisualization) {}

  markAsExecuted(id: string, isEdge = false) {
    if (isEdge) {
      logProcessExecution(`highlighting ${id}`);
      this.bpmnVisualization.bpmnElementsRegistry.updateStyle(id, {
        font: {opacity: 'default'},
        opacity: 'default',
        stroke: {color: 'blue', width: 4},
      });
      logProcessExecution(`done highlight of ${id}`);
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
    }

    this.pastExecutedId = this.lastExecutedId;
    if (this.lastExecutedId) {
      logProcessExecution(`reducing opacity of ${this.lastExecutedId}`);
      this.bpmnVisualization.bpmnElementsRegistry.updateStyle(this.lastExecutedId, {opacity: 50});
      logProcessExecution(`done reduce opacity of ${this.lastExecutedId}`);
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
  }
}
