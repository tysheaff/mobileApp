const headers = {
    'content-type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Safari/605.1.15'
};

const host = 'https://bitclout.com/api/v0/';

function handleResponse(p_response: Response) {
    if (p_response.ok) {
        return p_response.json().catch(() => { });
    } else {
        const error = new Error(JSON.stringify(p_response));
        (error as any).status = p_response.status;
        throw error;
    }
}

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

const getNftBids = (publicKey: string, postHashHex: string) => {
    const route = 'get-nft-bids-for-nft-post';
    return post(
        route,
        {
            ReaderPublicKeyBase58Check: publicKey,
            PostHashHex: postHashHex
        }
    );
};

const getNftBidEditions = (publicKey: string, postHashHex: string) => {
    const route = 'get-nft-collection-summary';
    return post(
        route,
        {
            ReaderPublicKeyBase58Check: publicKey,
            PostHashHex: postHashHex
        }
    );
};

const placeNftBid = (bidAmount: number, nftPostHashHex: string, serialNumber: number, publicKey: string) => {
    const route = 'create-nft-bid';
    return post(
        route,
        {
            BidAmountNanos: bidAmount,
            MinFeeRateNanosPerKB: 1000,
            NFTPostHashHex: nftPostHashHex,
            SerialNumber: serialNumber,
            UpdaterPublicKeyBase58Check: publicKey
        }
    );
};

const updateNftBid = (forSale: boolean, minBidAmountNanos: number | null, postHashHex: string, serialNumber: number, publicKey: string) => {
    const route = 'update-nft';
    return post(
        route,
        {
            IsForSale: forSale,
            MinBidAmountNanos: minBidAmountNanos,
            MinFeeRateNanosPerKB: 1000,
            NFTPostHashHex: postHashHex,
            SerialNumber: serialNumber,
            UpdaterPublicKeyBase58Check: publicKey
        }
    );
};

const mintPost = (
    hasUnlockable: boolean,
    forSale: boolean,
    minBidAmountNanos: number,
    postHashHex: string,
    royaltyToCoinBasisPoints: number,
    royaltyToCreatorBasisPoints: number,
    numCopies: number,
    publicKey: string
) => {
    const route = 'create-nft';
    return post(
        route,
        {
            HasUnlockable: hasUnlockable,
            IsForSale: forSale,
            MinBidAmountNanos: minBidAmountNanos,
            MinFeeRateNanosPerKB: 1000,
            NFTPostHashHex: postHashHex,
            NFTRoyaltyToCoinBasisPoints: royaltyToCoinBasisPoints,
            NFTRoyaltyToCreatorBasisPoints: royaltyToCreatorBasisPoints,
            NumCopies: numCopies,
            UpdaterPublicKeyBase58Check: publicKey
        }
    );
};

const sellNft = (bidAmountNanos: number, bidderPublicKey: string, encryptedUnlockableText: string, postHashHex: string, serialNumber: number, updaterPublicKey: string) => {
    const route = 'accept-nft-bid';
    return post(
        route,
        {
            BidAmountNanos: bidAmountNanos,
            BidderPublicKeyBase58Check: bidderPublicKey,
            EncryptedUnlockableText: encryptedUnlockableText,
            MinFeeRateNanosPerKB: 1000,
            NFTPostHashHex: postHashHex,
            SerialNumber: serialNumber,
            UpdaterPublicKeyBase58Check: updaterPublicKey
        }
    );
};

export const nftApi = {
    getNftBids,
    getNftBidEditions,
    placeNftBid,
    updateNftBid,
    mintPost,
    sellNft
};
