import { ActivityIndicator, FlatList, StyleSheet, View, Text } from 'react-native';
import React from "react";
import { Post } from "@types";
import { api } from "@services";
import { globals } from "@globals/globals";
import { cache } from '@services/dataCaching';
import { themeStyles } from '@styles/globalColors';
import { PostComponent } from '@components/post/post.component';
import { NavigationProp } from '@react-navigation/native';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';

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

        const keyExtractor = (item: Post, index: number) => item.PostHashHex + index;
        const renderItem = ({ item }: { item: Post }) => <PostComponent route={this.props.route} navigation={this.props.navigation} post={item} />;
        const renderFooter = this.state.isLoadingMore && !this.state.isLoading
            ? <ActivityIndicator color={themeStyles.fontColorMain.color} />
            : undefined;

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.state.isLoading
                    ? <CloutFeedLoader />
                    : this.state.posts.length === 0
                        ? <Text style={[styles.emptyText, themeStyles.fontColorSub]}>No quotes for this post yet</Text>
                        : <FlatList
                            data={this.state.posts}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
                            onEndReached={() => this.loadQuotes(true)}
                            onEndReachedThreshold={3}
                            maxToRenderPerBatch={5}
                            windowSize={8}
                            ListFooterComponent={renderFooter}
                        />
            }
        </View>
    }
}
const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
        },
        activityIndicator: {
            marginTop: 100
        },
        emptyText: {
            fontSize: 16,
            textAlign: 'center',
            marginTop: 40,
        }
    }
);