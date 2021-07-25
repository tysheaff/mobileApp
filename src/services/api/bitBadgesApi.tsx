import { api } from './api';

const headers = {
	'content-type': 'application/json',
	'User-Agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15',
};

const host = 'https://us-central1-bitbadges.cloudfunctions.net/api/';

async function handleResponse(p_response: Response) {
	if (p_response.ok) {
		return p_response.json();
	}
	else {
		const errBody = await p_response.json();
		const error = new Error(JSON.stringify(p_response));
		(error as any).status = p_response.status;
		(error as any).body = errBody;
		throw error;
	}
}

const get = (p_route: string, p_useHost = true, noCache = false) => {
	const newHeaders: any = headers;

	if (noCache) {
		newHeaders['cache-control'] = 'no-cache';
	}

	return fetch(p_useHost ? host + p_route : p_route, {
		headers: newHeaders,
	}).then((p_response) => handleResponse(p_response));
};

const post = (p_route: string, p_body: any) => {
	return fetch(host + p_route, {
		headers: headers,
		method: 'POST',
		body: JSON.stringify(p_body),
	}).then((p_response) => handleResponse(p_response));
};

function getUser(p_userid: string) {
	const route = `users/${p_userid}`;
	return get(route);
}

async function getBadges(p_badgeIds: string[]) {
	const route = 'badges';
	const body = {
		badgeIds: p_badgeIds,
	};
	return post(route, body);
}

async function issueBadge(
	p_title: string,
	p_validDateEnd: number,
	p_validDateStart: number,
	p_validDates: boolean,
	p_description: string,
	p_backgroundColor: string,
	p_externalUrl: string,
	p_imageUrl: string,
	p_recipients: string[],
	p_issuer: string,
	p_publickey: string,
	p_jwt: string,
	p_signedTransactionHex: string,
	p_amountNanos: number
) {
	const recipients: string[] = [];
	for (const username of p_recipients) {
		await api.getSingleProfile(username).then(
		(res) => {
			if (res.Profile.PublicKeyBase58Check) {
			recipients.push(res.Profile.PublicKeyBase58Check);
			}
		}
		);
	}

	const route = 'badge';
	const body = {
		title: p_title,
		validDateEnd: p_validDateEnd,
		validDateStart: p_validDateStart,
		validDates: p_validDates,
		description: p_description,
		backgroundColor: p_backgroundColor,
		externalUrl: p_externalUrl,
		imageUrl: p_imageUrl,
		recipients,
		issuer: p_issuer,
		publickey: p_publickey,
		jwt: p_jwt,
		amountNanos: p_amountNanos,
		signedTransactionHex: p_signedTransactionHex,
	};

	return post(route, body);
}

async function acceptBadge(
	p_badgeId: string,
	p_publicKey: string,
	p_jwt: string
) {
	const route = 'acceptBadge';
	const body = {
		badgeId: p_badgeId,
		publickey: p_publicKey,
		jwt: p_jwt,
	};

	return post(route, body);
}

async function declineBadge(
	p_badgeId: string,
	p_publicKey: string,
	p_jwt: string
) {
	const route = 'declineBadge';
	const body = {
		badgeId: p_badgeId,
		publickey: p_publicKey,
		jwt: p_jwt,
	};

	return post(route, body);
}

export const bitBadgesApi = {
	getUser,
	getBadges,
	issueBadge,
	acceptBadge,
	declineBadge,
};
