export interface Badge {
    backgroundColor: string;
    dateCreated: number;
    description: string;
    externalUrl: string;
    id: string;
    imageUrl: string;
    issuer: string;
    issuerUsername: string;
    recipients: string[];
    recipientsUsernames: string[];
    title: string;
    validDateEnd: number;
    validDateStart: number;
    validDates: boolean;
    category: string;
    collectionId: string;
    isVisible: boolean;
    issuerChain: string;
    attributes: string;
    recipientsChains: string[];
}

export interface BitBadgesUserDetails {
    badgesIssued: string[];
    badgesListed: string[];
    badgesReceived: string[];
    badgesPending: string[];
    badgesAccepted: string[];
    portfolioPages: PortfolioPage[];
}

export interface PortfolioPage {
    title: string;
    data: Badge[];
    badges: Badge[];
    pageTitle: string;
    description: string;
    pageNum: number;
}
