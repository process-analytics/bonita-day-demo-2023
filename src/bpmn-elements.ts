const mainActivities = new Map<string, string>();
mainActivities.set('Activity_0ec8azh', 'SRM subprocess');
mainActivities.set('Activity_1t65hvk', 'Create Purchase Order Item');
mainActivities.set('Activity_06cvihl', 'Record Service Entry Sheet');
mainActivities.set('Activity_00vbm9s', 'Record Goods Receipts');
mainActivities.set('Activity_1u4jwkv', 'Record Invoice Receipt');
mainActivities.set('Activity_083jf01', 'Remove Payment Block');
mainActivities.set('Activity_0yabbur', 'Clear Invoice');

const mainGateways = new Map<string, string>();
mainGateways.set('Gateway_0xh0plz', 'parallelGatewaySplit1');
mainGateways.set('Gateway_0domayw', 'parallelGatewayJoin1');
mainGateways.set('Gateway_0apcz1e', 'parallelGatewaySplit2');
mainGateways.set('Gateway_01gpztl', 'parallelGatewayJoin2');
mainGateways.set('Gateway_08gf298', 'exclusiveGatewaySplit1');
mainGateways.set('Gateway_0jqn9hp', 'exclusiveGatewayJoin1');
mainGateways.set('Gateway_0a68dfj', 'exclusiveGatewaySplit2');
mainGateways.set('Gateway_1ezcj46', 'exclusiveGatewayJoin2');

const mainEvents = new Map<string, string>();
mainEvents.set('Event_1vogvxc', 'New POI Needed');
mainEvents.set('Event_0e43ncy', 'Vendor Creates Invoice');
mainEvents.set('Event_07598zy', 'endEvent');

/*
  BPMN elements of secondary process
*/
const secondaryActivities = new Map<string, string>();
secondaryActivities.set('Activity_157vm5m', 'SRM: Created');
secondaryActivities.set('Activity_1243ie0', 'SRM: Complete');
secondaryActivities.set('Activity_1p3opxc', 'SRM: Awaiting Approval');
secondaryActivities.set('Activity_015g8ru', 'SRM: Document Completed');
secondaryActivities.set('Activity_0k8i7cb', 'SRM: Ordered');
secondaryActivities.set('Activity_0yyl6g2', 'SRM: In Transfer to Execution Syst.');
secondaryActivities.set('Activity_16tcn1j', 'SRM: Change was Transmitted');

const secondaryGateways = new Map<string, string>();
secondaryGateways.set('Gateway_0w0fs3j', 'parallelGatewaySplit1');
secondaryGateways.set('Gateway_1cjjox7', 'parallelGatewayJoin1');

const secondaryEvents = new Map<string, string>();
secondaryEvents.set('Event_1dnxra5', 'New SRM entry');
secondaryEvents.set('Event_0bp3ymm', 'endEvent');

export function isActivity(elementId: string, processId: string): boolean {
  if(processId === "main"){
    return mainActivities.has(elementId);
  }
  else{
    return secondaryActivities.has(elementId);
  }
}

export function isGateway(elementId: string, processId: string): boolean {
  if(processId === "main"){
    return mainGateways.has(elementId);
  }
  else{
    return secondaryGateways.has(elementId);
  }
}

export function isEvent(elementId: string, processId: string): boolean {
  if(processId === "main"){
    return mainEvents.has(elementId);
  }
  else{
    return secondaryEvents.has(elementId);
  } 
}

export function getElementIdByName(elementName: string, processId: string): string | undefined {
  let activities = new Map<string, string>();
  let events = new Map<string, string>();
  if(processId === "main"){
    activities = mainActivities;
    events= mainEvents;
  }
  else{
    activities = secondaryActivities;
    events = secondaryEvents;
  }

  for (const [key, value] of activities.entries()) {
      if (value === elementName) {
        return key;
      }
  }
  for (const [key, value] of events.entries()) {
    if (value === elementName) {
      return key;
    }
  }
  return undefined;
}
