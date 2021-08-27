import React from 'react';
import { ParamListBase } from '@react-navigation/native';
import { StyleSheet, FlatList, Text, View } from 'react-native';
import { cloutApi } from '@services/api/cloutApi';
import { CloutTag } from '@types';
import { themeStyles } from '@styles/globalColors';
import { isNumber } from '@services/helpers';
import { navigatorGlobals } from '@globals/navigatorGlobals';
import { globals } from '@globals/globals';
import CloutTagListCardComponent from './components/cloutTagCard.component';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
}

interface State {
    cloutTags: CloutTag[];
    isLoading: boolean;
}

export default class CloutTagSearchScreen extends React.Component<Props, State> {

    private _isMounted = false;

    private _timer: number | undefined = undefined;

    private _lastCloutTagPrefix = '';

    private _topCloutTags: CloutTag[] = [];

    private _focusSubscription: () => void;

    constructor(props: Props) {
        super(props);

        this.state = {
            cloutTags: [],
            isLoading: true,
        };

        this.init = this.init.bind(this);
        this.init();

        this._focusSubscription = this.props.navigation.addListener(
            'focus',
            () => {
                this.setSearchMethod();

                if (this._topCloutTags.length && this._isMounted) {
                    this.setState({ cloutTags: this._topCloutTags });
                }
            }
        );
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
        this._focusSubscription();
    }

    setSearchMethod() {
        navigatorGlobals.searchResults = (p_cloutTagPrefix: string) => {
            p_cloutTagPrefix = p_cloutTagPrefix.trim();
            this._lastCloutTagPrefix = p_cloutTagPrefix;

            if (isNumber(this._timer)) {
                window.clearTimeout(this._timer);
            }

            if (!p_cloutTagPrefix) {
                this.setState({ cloutTags: this._topCloutTags, isLoading: false });
            }
            else {
                if (this._isMounted) {
                    this.setState({ isLoading: true });
                }
                this._timer = window.setTimeout(
                    () => {
                        cloutApi.searchCloutTags(p_cloutTagPrefix).then(
                            response => {
                                if (this._isMounted && this._lastCloutTagPrefix === p_cloutTagPrefix) {
                                    this.setState({ cloutTags: response, isLoading: false });
                                }
                            }
                        ).catch(error => globals.defaultHandleError(error));
                    },
                    500
                );
            }
        };
    }

    async init() {
        const response = await cloutApi.getTrendingClouts(20);
        if (this._isMounted) {
            this._topCloutTags = response;
            this.setState({ cloutTags: response, isLoading: false });
        }
    }

    render() {
        const renderItem = (item: CloutTag) =>
            <CloutTagListCardComponent
                navigation={this.props.navigation}
                cloutTag={item} />;
        const keyExtractor = (item: CloutTag, index: number) => `${item.clouttag}_${index}`;

        return (
            this.state.isLoading ?
                <CloutFeedLoader />
                :
                <View style={[styles.container, themeStyles.containerColorMain]}>
                    {
                        this.state.cloutTags.length !== 0 ?
                            <FlatList
                                data={this.state.cloutTags}
                                renderItem={({ item }) => renderItem(item)}
                                keyExtractor={keyExtractor}
                            />
                            : <Text style={[themeStyles.fontColorSub, styles.noResults]}>No results found</Text>
                    }
                </View>
        );
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1
        },
        noResults: {
            fontSize: 15,
            textAlign: 'center',
            marginTop: 40,
        }
    }
);
