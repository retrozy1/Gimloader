interface GameSession {
    callToAction: any;
    countdownEnd: number;
    phase: string;
    resultsEnd: number;
    widgets: { widgets: any[] };
}

export default interface Session {
    allowGoogleTranslate: boolean;
    amIGameOwner: boolean;
    canAddGameTime: boolean;
    cosmosBlocked: boolean;
    customTeams: { characterToTeamMap: Map<string, string> };
    duringTransition: boolean;
    gameClockDuration: string;
    gameOwnerId: string;
    gameSession: GameSession;
    gameTime: number;
    gameTimeLastUpdateAt: number;
    globalPermissions: Permissions;
    loadingPhase: boolean;
    mapCreatorRoleLevel: number;
    mapStyle: string;
    modeType: string;
    ownerRole: string;
    phase: string;
    phaseChangedAt: number;
    version: string;
}
