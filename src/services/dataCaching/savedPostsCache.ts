import { globals } from '@globals/globals';
import { cloutApi } from '@services/api/cloutApi';
import { signing } from '@services/authorization/signing';

export class SavedPostsCache {

    public savedPosts: { [key: string]: boolean } = {};

    constructor() { }

    public async reloadData(): Promise<{ [key: string]: boolean }> {
        const jwt = await signing.signJWT();
        const savedPosts = await cloutApi.getSavedPosts(globals.user.publicKey, jwt);
        const savedPostsMap: { [key: string]: boolean } = {};
        if (savedPosts?.length > 0) {
            for (const savedPost of savedPosts) {
                savedPostsMap[savedPost] = true;
            }
        }

        this.savedPosts = savedPostsMap;
        return savedPostsMap;
    }
}
