import { View, ActivityIndicator, FlatList } from 'react-native';
import React from "react";
import { Post } from "@types";
import { api } from "@services";
import { globals } from "@globals/globals";
import { cache } from '@services/dataCaching';
import { themeStyles } from '@styles/globalColors';
import { PostComponent } from '@components/post/post.component';
import { NavigationProp } from '@react-navigation/native';

interface Props {
    postHashHex: string;
    navigation: NavigationProp<any>;
    route: any;
}

interface State {
    isLoading: boolean;
    posts: Post[];
    isLoadingMore: boolean;
}

export class PostQuoteStatsComponent extends React.Component<Props, State> {

    private _blockPublicKeys: any;
    private _noMoreData = false;
    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            posts: [],
            isLoadingMore: false
        };

        this.init();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    async init() {
        try {
            const user = await cache.user.getData();
            this._blockPublicKeys = user.BlockedPubKeys;
            await this.loadQuotes(false);
        } catch {

        }
    }

    async loadQuotes(p_loadMore: boolean) {
        try {
            if (this.state.isLoadingMore || this._noMoreData) {
                return;
            }

            if (this._isMounted) {
                this.setState({ isLoading: !p_loadMore, isLoadingMore: p_loadMore });
            }

            const response = await api.getQuotesForPost(globals.user.publicKey, this.props.postHashHex, 50, this.state.posts.length);
            let quotes: Post[] = response.QuoteReclouts;

            let newQuotes = this.state.posts;
            if (quotes?.length > 0) {
                quotes = quotes.filter(p_quote => !this._blockPublicKeys[p_quote.ProfileEntryResponse.PublicKeyBase58Check]);
                newQuotes.push(...quotes);
            }

            if (quotes?.length < 50) {
                this._noMoreData = true;
            }

            if (this._isMounted) {
                this.setState({ posts: newQuotes, isLoading: false, isLoadingMore: false });
            }

        } catch {
        }
    }

    render() {
        if (this.state.isLoading) {
            return <View style={{ height: 200, justifyContent: 'center' }}>
                <ActivityIndicator style={{ alignSelf: 'center' }} color={themeStyles.fontColorMain.color} />
            </View>;
        }

        const keyExtractor = (item: Post, index: number) => item.PostHashHex + index;
        const renderItem = ({ item }: { item: Post }) => <PostComponent route={this.props.route} navigation={this.props.navigation} post={item}></PostComponent>;

        return <FlatList
            data={this.state.posts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onEndReached={() => this.loadQuotes(true)}
            onEndReachedThreshold={3}
            maxToRenderPerBatch={5}
            windowSize={8}
            ListFooterComponent={this.state.isLoadingMore && !this.state.isLoading ? <ActivityIndicator color={themeStyles.fontColorMain.color}></ActivityIndicator> : undefined}
        />;
    }
}