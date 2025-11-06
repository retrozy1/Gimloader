import type { RoomCache } from 'colyseus';
import type { CodeInfoFailure, CodeInfoSuccess, Experience, Hook, LiveGameOptions, MapCreationOptions, MatchmakerOptions, PublicGame } from './matchmaker';
import type { OpenedCosmetic, OwnedCosmetic, Pack, PackCosmetic, PackCosmeticItem, Shop, STCosmetic } from './cosmos';
import type { Creator, Folder, Game, QuestionAdded, QuestionEdit } from './kits';
import type { FullGroup, HubItem } from './groups';
import type { CreatedMap, PublicMapSection } from './maps';
import type { InformationUpdate, UserData } from './users';

interface NewsPost {
    _id: string;
    publishDate: number;
    notionPageId: string;
}

export interface EndpointRequests {
    "/api/news/fetch": {
        isStudent: boolean;
    };
    "/api/matchmaker/intent/map/play/create": {
        experienceId: string;
        matchmakerOptions: MatchmakerOptions;
        options: MapCreationOptions;
    };
    "/api/matchmaker/intent/live-game/create": {
        experienceId: string;
        gameId: string;
        gameOptions: LiveGameOptions;
        matchmakerOptions: MatchmakerOptions;
    }
    "/api/games/delete": {
        id: string;
    };
    "/api/games/search": {
        language?: string;
        query: string;
        sort: "relevant" | "recent";
        page: number;
        subject?: string;
    };
    "/api/folders/new": {
        title: string;
    };
    "/api/folders/addGame": {
        folderId: string;
        gameId: string;
    };
    "/api/matchmaker/find-info-from-code": {
        code: string;
    };
    "/api/matchmaker/join": {
        clientType: string;
        name: string;
        roomId: string;
    };
    "/matchmake/create/MapRoom": {
        authToken: string;
        intentId: string;
    };
    "/api/v1/editor/edit-session": {
        kitId: string;
    };
    "/api/v1/editor/questions/add": {
        questions: QuestionEdit[];
    };
    "/api/games/archived": {
        archived: boolean;
        id: string;
    };
    "/api/created-map/create": {
        mapStyle: "topDown" | "platformer"
    };
    "/api/created-map/rename": {
        id: string;
        name: string;
    };
    "/api/created-map/delete": {
        id: string;
    }
    "/api/created-map/listing/discovery/search": {
        query: string;
    }
    "/api/cosmos/pack/open": {
        count: number;
        pack: string;
    };
    "/api/cosmos/select-cosmetic": {
        cosmeticId: string;
        cosmeticType: string;
    }
    "/api/v1/givekit/apply": {
        comments: string;
        dateNeeded: string;
        email: string;
        firstName: string;
        lastName: string;
        permission: boolean;
        projectLink: string;
        role: string;
    };
    "/api/users/update-information": {
        changes: InformationUpdate[];
    }
}

export interface EndpointResponses {
    "/api/games/gallery": PublicGame[];
    "/api/games/summary/me": {
        games: Game[];
        folders: Folder[];
    };
    "/api/games/search": {
        results: PublicGame[];
        hasMore: boolean;
        page: number;
    };
    "/api/folders/new": string;
    "/pages/general": {
        userData: UserData;
    };
    [key: `/api/hub/hub-items${string}`]: HubItem[];
    "/api/v1/groups": any[];
    "/api/v1/groups/part-of": FullGroup[];
    "/api/news/fetch": NewsPost[];
    [key: `/api/games/fetch/${string}`]: {
        kit: Game;
        creator: Creator;
    };
    "/api/experiences": Experience[];
    "/api/experience/map/hooks": {
        hooks: Hook[];
    };
    "/api/matchmaker/find-info-from-code": CodeInfoSuccess | CodeInfoFailure;
    [key: `/api/matchmaker/intent/fetch-source/${string}`]: string;
    [key: `/api/matchmaker/intent/map/summary/${string}`]: {
        mapId: string;
    };
    "/api/matchmaker/instant-join": any;
    "/matchmake/create/MapRoom": {
        room: Omit<RoomCache, "publicAddress" | "metadata">;
        sessionId: string;
    }
    "/api/v1/editor/questions/add": QuestionAdded[];
    "/api/created-maps": CreatedMap[];
    "/api/created-map/basics": {
        mapLimit: number;
        completedTutorial: null | boolean;
    };
    "/api/created-map/create": string;
    "/api/created-map/rename": string;
    "/api/created-map/delete": string;
    "/api/cosmos/shop": {
        shop: Shop;
        packs: Pack[];
    };
    "/api/cosmos/basics": {
        currentLevel: number;
        unredeemedXP: number;
        xpGainedInPeriod: number;
        xpGainedToday: number;
        maxXpInPeriod: number;
        maxXpToday: number;
        currencyGainedPerLevel: number;
        xpNeededPerLevel: number;
        currency: number;
        selectedCharacter: string | null;
    }
    "/api/cosmos/owned-cosmetics": {
        ownedCosmetics: OwnedCosmetic[];
        selected: {
            character: string | null;
            trail: string | null;
        };
    };
    [key: `/api/cosmos/pack/details/${string}`]: {
        name: string;
        cosmetics: PackCosmetic[];
        items: PackCosmeticItem[];
        currencyCost: number;
    };
    "/api/cosmos/pack/open": OpenedCosmetic[];
    "/api/cosmos/season-ticket": STCosmetic[];
    "/api/cosmos/select-cosmetic": "OK";
    "/api/cosmos/owned-stickers": { id: string, name: string }[];
    "/api/created-map/listing/discovery": PublicMapSection[];
    "/api/v1/givekit/apply": "OK";
    // This seems to be some complex type of something called "crdt"
    [key: `/api/content/${string}`]: Record<string, any>;
    "/api/users/update-information": "OK";
}