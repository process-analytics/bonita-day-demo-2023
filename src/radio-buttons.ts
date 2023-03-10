import { BpmnVisualization } from 'bpmn-visualization';
import {hideMonitoringData, showMonitoringData} from './case-monitoring.js';

let checkedRadioButton: RadioButton | null = null;

/**
 * @param {BpmnVisualization} bpmnVisualization
 */
export function configureRadioButtons(bpmnVisualization: BpmnVisualization) {
    new RadioButton('online_monitoring', () => showMonitoringData(bpmnVisualization), () => hideMonitoringData(bpmnVisualization));
    document.getElementById('reset_all')?.addEventListener('click', () => checkedRadioButton?.hide());
}

class RadioButton {
    private hideCallback: () => any;
    private static checkedRadioButton: RadioButton | null = null;
    
    constructor(id: string, showCallback: () => any, hideCallback: () => any) {
      this.hideCallback = hideCallback;
  
      document.getElementById(id)?.addEventListener('click', () => {
        if (RadioButton.checkedRadioButton !== this) {
          RadioButton.checkedRadioButton?.hide();
          showCallback();
          RadioButton.checkedRadioButton = this;
        }
      });
    }
  
    hide() {
      if (RadioButton.checkedRadioButton === this) {
        this.hideCallback();
        RadioButton.checkedRadioButton = null;
      }
    }
  }