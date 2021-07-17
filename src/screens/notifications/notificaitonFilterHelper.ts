import { globals } from '@globals/globals';
import { Notification, NotificationType, Post } from '@types';
import { NotificationsFilter } from './components/notificationsFilter.component';

function checkReplyNotification(p_notification: Notification, p_posts: any): boolean {
    const parentPostHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex;
    let parentPost;
    if (parentPostHashHex) {
        parentPost = p_posts[parentPostHashHex];
        return parentPost && parentPost.ProfileEntryResponse.PublicKeyBase58Check === globals.user.publicKey;
    }
    return false;
}

function checkMention(p_notification: Notification, p_posts: any): boolean {
    const postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
    const post: Post = p_posts[postHashHex];

    if (!post) {
        return false;
    }

    const parentPostHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.ParentPostHashHex;
    if (!post.RecloutedPostEntryResponse) {
        if (parentPostHashHex) {
            const parentPost = p_posts[parentPostHashHex];
            return !parentPost || parentPost.ProfileEntryResponse.PublicKeyBase58Check !== globals.user.publicKey;
        } else {
            return true;
        }
    } else if (post.RecloutedPostEntryResponse.ProfileEntryResponse?.PublicKeyBase58Check !== globals.user.publicKey) {
        return true;
    }

    return false;
}

function checkRecloutNotification(p_notification: Notification, p_posts: any): boolean {
    const postHashHex = p_notification.Metadata.SubmitPostTxindexMetadata?.PostHashBeingModifiedHex as string;
    const post: Post = p_posts[postHashHex];
    return !!post?.RecloutedPostEntryResponse &&
        post.RecloutedPostEntryResponse.ProfileEntryResponse?.PublicKeyBase58Check === globals.user.publicKey;
}

function checkCreatorCoinTransfer(p_notification: Notification, p_diamond: boolean): boolean {
    const diamondLevel = p_notification.Metadata.CreatorCoinTransferTxindexMetadata?.DiamondLevel as number;
    if (p_diamond) {
        return diamondLevel >= 1;
    }
    return diamondLevel === 0;
}

export function filterNotifications(p_notificaitons: Notification[], p_filter: NotificationsFilter, p_posts: any) {
    const filteredNotifications: Notification[] = [];
    for (const notification of p_notificaitons) {
        let add = false;
        if (p_filter.follow) {
            add = notification.Metadata.TxnType === NotificationType.Follow;
        }
        if (!add && p_filter.like) {
            add = notification.Metadata.TxnType === NotificationType.Like;
        }

        if (notification.Metadata.TxnType === NotificationType.SubmitPost) {
            if (!add && p_filter.reply) {
                add = checkReplyNotification(notification, p_posts);
            }
            if (!add && p_filter.reclout) {
                add = checkRecloutNotification(notification, p_posts);
            }
            if (!add && p_filter.mention) {
                add = checkMention(notification, p_posts);
            }
        }

        if (!add && p_filter.purchase) {
            add = notification.Metadata.TxnType === NotificationType.BasicTransfer ||
                notification.Metadata.TxnType === NotificationType.CreatorCoin;
        }

        if (notification.Metadata.TxnType === NotificationType.CreatorCoinTransfer) {
            if (!add && p_filter.creatorCoinTransfer) {
                add = checkCreatorCoinTransfer(notification, false);
            }
            if (!add && p_filter.diamond) {
                add = checkCreatorCoinTransfer(notification, true);
            }
        }

        if (add) {
            filteredNotifications.push(notification);
        }
    }
    return filteredNotifications;
}
