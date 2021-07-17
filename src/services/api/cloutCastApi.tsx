import { CLOUTFEED_API_KEY } from '@env';

const headers = {
    'content-type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15',
    'x-api-key': CLOUTFEED_API_KEY
};

const host = 'https://cloutfeedapi.azurewebsites.net/clout-cast/';

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

const post = (p_route: string, p_body: any, p_cloutCastToken?: string) => {
    const headersCopy = JSON.parse(JSON.stringify(headers));
    if (p_cloutCastToken) {
        (headersCopy)['clout-cast-bearer'] = p_cloutCastToken;
    }

    return fetch(
        host + p_route,
        {
            headers: headersCopy,
            method: 'POST',
            body: JSON.stringify(p_body)
        }
    ).then(async p_response => await handleResponse(p_response));
};

const authenticate = (p_publicKey: string, p_username: string, p_jwt: string) => {
    const route = 'authenticate';

    return post(
        route,
        {
            publicKey: p_publicKey,
            username: p_username,
            jwt: p_jwt
        }
    );
};

const promotions = () => {
    const route = 'promotions';

    return get(route);
};

const proofOfWork = (p_promotionId: number, p_publicKey: string, p_jwt: string, p_cloutCastToken: string) => {
    const route = 'proofOfWork/' + String(p_promotionId);
    return post(
        route,
        {
            publicKey: p_publicKey,
            jwt: p_jwt
        },
        p_cloutCastToken
    );
};

const blacklist = () => {
    const route = 'black-list';
    return get(route);
};

export const cloutCastApi = {
    authenticate,
    promotions,
    proofOfWork,
    blacklist
};
