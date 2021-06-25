const headers = {
    'content-type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15'
};

const host = 'https://api.cloutapis.com';

function handleResponse(p_response: Response) {
    if (p_response.ok) {
        return p_response.json();
    } else {
        const error = new Error(JSON.stringify(p_response));
        (error as any).status = p_response.status;
        throw error;
    }
}

const get = (p_route: string, p_useHost = true) => {
    return fetch(
        p_useHost ? host + p_route : p_route,
        { headers: headers }
    ).then(p_response => handleResponse(p_response));
};

const getTrendingClouts = (p_numToFetch: number, p_offset: number = 0) => {
    const route = `/clouttags/trending?numToFetch=${p_numToFetch}&offset=${p_offset}`;
    return get(route);
}

const getCloutTagPosts = (p_term: string, p_numToFetch: number, p_offset: number = 0) => {
    const route = `/clouttag/${p_term}/posts?numToFetch=${p_numToFetch}&offset=${p_offset}`;
    return get(route);
}

const searchCloutTags = (p_term: string) => {
    const route = `/clouttags/search/${p_term}`;
    return get(route);
}

export const cloutApi = {
    getTrendingClouts,
    searchCloutTags,
    getCloutTagPosts
};