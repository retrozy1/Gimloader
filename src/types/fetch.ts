export interface Gamemode {
    _id: string;
    name: string;
    tagline: string;
    imageUrl: string;
    source: string;
    pageId: string;
    mapId: string;
    isPremiumExperience: boolean;
    tag: string;
}

interface Category {
    _id: string;
    name: string;
    items: Gamemode[];
}

export type Experiences = Category[];

interface BaseCreativeMap {
    image: string;
    title: string;
    tags: string[];
}

export interface SingleCreativeMap extends BaseCreativeMap {
    description: string;
}

export interface ListCreativeMap extends BaseCreativeMap {
    _id: string;
}