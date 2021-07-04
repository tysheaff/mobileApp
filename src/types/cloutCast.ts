import { Post } from "./models";

export interface CloutCastPromotion {
    client: CloutCastPromotionClient;
    target: CloutCastPromotionTarget
    id: number;
    header: CloutCastPromotionHeader;
    criteria: CloutCastPromotionCriteria;
    events: CloutCastPromotionEvent;
    promoters: CloutCastPromotionClient[];
    post?: Post;
}

export interface CloutCastPromotionClient {
    publicKey: string;
}

export interface CloutCastPromotionEvent {
    action: string;
}

export interface CloutCastPromotionCriteria {
    minCoinPrice: number;
    minFollowerCount: number;
    allowedUsers: string[];
}

export interface CloutCastPromotionHeader {
    bitCloutToUsdRate: number;
    duration: number;
    engagements: number;
    fee: number;
    rate: number;
}

export interface CloutCastPromotionTarget {
    action: CloutCastAction;
    hex: string;
}

export enum CloutCastAction {
    ReClout = 'ReClout',
    Quote = 'Quote',
    Comment = 'Comment'
}