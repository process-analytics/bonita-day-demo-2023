const activitiesMap = new Map<string, string>();
activitiesMap.set("Activity_0ec8azh", "SRM subprocess");
activitiesMap.set("Activity_1t65hvk", "Create Purchase Order Item");
activitiesMap.set("Activity_06cvihl", "Record Service Entry Sheet");
activitiesMap.set("Activity_00vbm9s", "Record Goods Receipts");
activitiesMap.set("Activity_1u4jwkv", "Record Invoice Receipt");
activitiesMap.set("Activity_083jf01", "Remove Payment Block");
activitiesMap.set("Activity_0yabbur", "Clear Invoice");

const gatewaysMap = new Map<string, string>();
gatewaysMap.set("Gateway_0xh0plz", "parallelGatewaySplit1");
gatewaysMap.set("Gateway_0domayw", "parallelGatewayJoin1");
gatewaysMap.set("Gateway_0apcz1e", "parallelGatewaySplit2");
gatewaysMap.set("Gateway_01gpztl", "parallelGatewayJoin2");
gatewaysMap.set("Gateway_08gf298", "exclusiveGatewaySplit1");
gatewaysMap.set("Gateway_0jqn9hp", "exclusiveGatewayJoin1");
gatewaysMap.set("Gateway_0a68dfj", "exclusiveGatewaySplit2");
gatewaysMap.set("Gateway_1ezcj46", "exclusiveGatewayJoin2");

const eventsMap = new Map<string, string>();
eventsMap.set("Event_1vogvxc", "New POI Needed");
eventsMap.set("Event_0e43ncy", "Vendor Creates Invoice");
eventsMap.set("Event_07598zy", "endEvent");

export function isActivity(elementId: string): boolean {
    return activitiesMap.has(elementId);
}

export function isGateway(elementId: string): boolean {
    return gatewaysMap.has(elementId);
}

export function isEvent(elementId: string): boolean {
    return eventsMap.has(elementId);
}

export function getElementIdByName(elementName: string): string | null {
    for (let [key, value] of activitiesMap.entries()) {
        if(value === elementName){
            return key;
        }
    }
    for (let [key, value] of eventsMap.entries()) {
        if(value === elementName){
            return key;
        }
    }
    return null;
}