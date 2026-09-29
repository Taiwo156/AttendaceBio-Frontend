export interface Device {
    deviceId: string;
    companyId: string;
    divisionId: string;
    departmentId: string;
    branchCode: string;
    branchName: string;
    deviceName: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    deviceNumber: number;
    deviceType: string;
    ipAddress: string;
    port: number;
    commKey: number;
    enabled: boolean;
    automaticSync: boolean;
    createdAt: string;
    updatedAt: string | null;
}