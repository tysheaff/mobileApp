const headers = {
    'content-type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15'
};

const host = 'https://api.cloutapis.com/';

function handleResponse(response: Response) {
    if (response.ok) {
        return response.json();
    } else {
        const error = new Error(JSON.stringify(response));
        (error as any).status = response.status;
        throw error;
    }
}

const get = (route: string, useHost = true) => {
    return fetch(
        useHost ? host + route : route,
        { headers: headers }
    ).then(p_response => handleResponse(p_response));
};

const post = (p_route: string, p_body: any) => {
    return fetch(
        host + p_route,
        {
            headers: headers,
            method: 'POST',
            body: JSON.stringify(p_body)
        }
    ).then(p_response => handleResponse(p_response));
};

const getTrendingClouts = (numToFetch: number, offset: number = 0) => {
    const route = `clouttags/trending?numToFetch=${numToFetch}&offset=${offset}`;
    return get(route);
}

const getCloutTagPosts = (term: string, numToFetch: number, offset: number = 0) => {
    const route = `clouttag/${term}/posts?numToFetch=${numToFetch}&offset=${offset}`;
    return get(route);
}

const searchCloutTags = (term: string) => {
    const encodedTerm = encodeURIComponent(term);
    const route = `clouttags/search/${encodedTerm}`;
    return get(route);
}

const getSavedPosts = (publicKey: string, jwt: string) => {
    const route = `saved-posts/${publicKey}?jwt=${jwt}`;
    return get(route);
}

const savePost = (publicKey: string, jwt: string, postHashHex: string) => {
    const route = `saved-posts/save`;
    return post(
        route,
        {
            publicKey,
            jwt,
            postHashHex
        }
    );
}

const unsavePost = (publicKey: string, jwt: string, postHashHex: string) => {
    const route = `saved-posts/unsave`;
    return post(
        route,
        {
            publicKey,
            jwt,
            postHashHex
        }
    );
}

export const cloutApi = {
    getTrendingClouts,
    searchCloutTags,
    getCloutTagPosts,
    getSavedPosts,
    savePost,
    unsavePost
};