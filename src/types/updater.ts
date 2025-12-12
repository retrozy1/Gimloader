export interface Update {
    name: string;
    code: string;
}

export interface UpdateResponse {
    updated: boolean;
    failed?: boolean;
    version?: string;
}
