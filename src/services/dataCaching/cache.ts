import { api } from "../api/api";
import { CacheableObject } from "./cacheableObject";
import { globals } from "@globals";
import { User } from "@types";
import { SavedPostsCache } from "./savedPostsCache";

const loggedInUserCacheableObject = new CacheableObject<User>(
    () => api.getProfile([globals.user.publicKey]),
    p_response => {
        const user = p_response.UserList[0] as User;

        if (user.ProfileEntryResponse && !user.ProfileEntryResponse.ProfilePic) {
            user.ProfileEntryResponse.ProfilePic = api.getSingleProfileImage(globals.user.publicKey);
        }

        return user;
    },
    600
);

const addFollower = async (p_publicKey: string) => {
    const user = await loggedInUserCacheableObject.getData().catch(() => undefined);

    if (user) {
        if (!user.PublicKeysBase58CheckFollowedByUser) {
            user.PublicKeysBase58CheckFollowedByUser = [p_publicKey];
        } else {
            const publicKeyExists = user.PublicKeysBase58CheckFollowedByUser.indexOf(p_publicKey) !== -1;

            if (!publicKeyExists) {
                user.PublicKeysBase58CheckFollowedByUser.push(p_publicKey);
            }
        }
    }
}

const removeFollower = async (p_publicKey: string) => {
    const user = await loggedInUserCacheableObject.getData().catch(() => undefined);

    if (user) {
        if (user.PublicKeysBase58CheckFollowedByUser) {
            const publicKeyIndex = user.PublicKeysBase58CheckFollowedByUser.indexOf(p_publicKey);

            if (publicKeyIndex !== -1) {
                user.PublicKeysBase58CheckFollowedByUser.splice(publicKeyIndex, 1);
            }
        }
    }
}

interface Cache {
    user: CacheableObject<User>;
    addFollower: (publicKey: string) => void;
    removeFollower: (publicKey: string) => void;
    savedPosts: SavedPostsCache;
}

export let cache: Cache;

export function initCache() {
    cache = {
        user: loggedInUserCacheableObject,
        addFollower: addFollower,
        removeFollower: removeFollower,
        savedPosts: new SavedPostsCache()
    };
}

initCache();
