import { api } from './api/api';

export async function parseVideoLinkAsync(p_videoLink: string) {
    if (!p_videoLink) {
        return undefined;
    }

    const videoLink = parseVideoLink(p_videoLink);

    if (videoLink) {
        return videoLink;
    }

    const tiktokRegExp2 = /^.*(vm\.tiktok\.com\/)([A-Za-z0-9]{6,12}).*/;
    const tiktokMatch2 = p_videoLink.match(tiktokRegExp2);

    if (tiktokMatch2 && tiktokMatch2.length > 2) {
        const videoId = tiktokMatch2[2];
        try {
            const response = await api.getTikTokFullVideoId(videoId);
            const fullUrl = response.FullTikTokURL;
            const fullVideoId = extractTikTokVideoId(fullUrl);
            const videoLink = 'https://www.tiktok.com/embed/v2/' + fullVideoId;
            return videoLink;
        } catch {
        }
    }

    return undefined;
}

export function parseVideoLink(p_videoLink: string) {

    if (!p_videoLink) {
        return undefined;
    }

    // youtube
    const youtubeRegExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const youtubeMatch = p_videoLink.match(youtubeRegExp);
    if (youtubeMatch && youtubeMatch[7].length == 11) {
        const videoId = youtubeMatch[7];
        const videoLink = 'https://www.youtube.com/embed/' + videoId;
        return videoLink;
    }

    // vimeo
    const vimeoRegExp = /^.*(player\.)?(vimeo\.com\/)(video\/)?((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const vimeoMatch = p_videoLink.match(vimeoRegExp);

    if (vimeoMatch && vimeoMatch.length > 7) {
        const videoId = vimeoMatch[7];
        const videoLink = 'https://player.vimeo.com/video/' + videoId;
        return videoLink;
    }

    // tiktok
    const tikTokVideoId = extractTikTokVideoId(p_videoLink);
    if (tikTokVideoId != null) {
        const videoLink = 'https://www.tiktok.com/embed/v2/' + tikTokVideoId;
        return videoLink;
    }

    // spotify
    const spotifyRegExp = /^.*(open\.)?spotify\.com\/(((embed\/)?(track|artist|playlist|album))|((embed-podcast\/)?(episode|show)))\/([A-Za-z0-9]{0,25}).*/;
    const spotifyMatch = p_videoLink.match(spotifyRegExp);
    if (spotifyMatch && spotifyMatch[9]) {
        let videoLink = 'https://open.spotify.com/';
        if (spotifyMatch[8]) {
            videoLink += `embed-podcast/${spotifyMatch[8]}/${spotifyMatch[9]}`;
            return videoLink;
        }
        if (spotifyMatch[5]) {
            videoLink += `embed/${spotifyMatch[5]}/${spotifyMatch[9]}`;
            return videoLink;
        }
    }

    // sound cloud
    const soundCloudRegExp = /^.*(soundcloud.com\/([a-z0-9-_]+)\/(sets\/)?([a-z0-9-_]+)).*/;
    const soundCloudMatch = p_videoLink.match(soundCloudRegExp);

    if (soundCloudMatch && soundCloudMatch.length > 1) {
        const videoId = soundCloudMatch[1];
        const videoLink = `https://w.soundcloud.com/player/?url=https://${videoId}?hide_related=true&show_comments=false`;
        return videoLink;
    }

    // giphy
    const giphyRegExp = /^.*((media\.)?giphy\.com\/(gifs|media|embed|clips)\/)([A-Za-z0-9]+-)*([A-Za-z0-9]{0,20}).*/;
    const giphyMatch = p_videoLink.match(giphyRegExp);

    if (giphyMatch && giphyMatch.length > 5) {
        const videoId = giphyMatch[5];
        const videoLink = 'https://giphy.com/embed/' + videoId;
        return videoLink;
    }

    return undefined;
}

function extractTikTokVideoId(p_url: string) {
    const tiktokRegExp = /^.*((tiktok\.com\/)(v\/)|(@[A-Za-z0-9_-]{2,24}\/video\/)|(embed\/v2\/))(\d{0,30}).*/;
    const tiktokMatch = p_url.match(tiktokRegExp);

    if (tiktokMatch && tiktokMatch.length > 6) {
        const videoId = tiktokMatch[6];
        return videoId;
    }

    return undefined;
}
