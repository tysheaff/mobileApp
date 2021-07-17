const headers = {
    'content-type': 'application/json'
};

const host = 'https://api.searchclout.net/';

async function handleResponse(p_response: Response) {
    if (p_response.ok) {
        return p_response.json();
    } else {
        let json = undefined;
        try {
            json = await p_response.json();
        } catch {
        }
        const error = new Error();
        (error as any).response = p_response;
        (error as any).json = json;
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

const getTrendingPosts = (p_interval: 'day' | 'week', p_page: number) => {
    const route = `trends/posts/${p_interval}/${p_page}?full=0`;

    return get(route);
};

export const searchCloutApi = {
    getTrendingPosts
};
