import React from 'react'
import { NavigationProp } from '@react-navigation/native';
import { StyleSheet, FlatList, ActivityIndicator, Text, View } from 'react-native';
import { cloutApi } from '@services/api/cloutApi';
import { CloutTag } from '@types';
import { themeStyles } from '@styles/globalColors';
import { isNumber } from '@services/helpers';
import { navigatorGlobals } from '@globals/navigatorGlobals';
import { globals } from '@globals/globals';
import CloutListCardComponent from './components/cloutTagCard.component';

interface Props {
    navigation: NavigationProp<any>;
}

interface State {
    cloutTags: CloutTag[];
    isLoading: boolean;
}

export default class CloutTagSearchScreen extends React.Component<Props, State> {

    private _isMounted = false;
    private _timer: number | undefined = undefined;
    private _lastCloutTagPrefix: string = '';
    private _topCloutTags: CloutTag[] = [];
    private _focusSubscription: any;

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
                    async () => {
                        try {
                            const response = await cloutApi.searchCloutTags(p_cloutTagPrefix);

                            if (this._isMounted && this._lastCloutTagPrefix === p_cloutTagPrefix) {
                                this.setState({ cloutTags: response, isLoading: false });
                            }
                            this._timer = undefined;
                        } catch (p_error) {
                            globals.defaultHandleError(p_error);
                        }
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
            <CloutListCardComponent
                navigation={this.props.navigation}
                cloutTag={item} />;
        const keyExtractor = (item: CloutTag, index: number) => `${item.clouttag}_${index}`;

        return (
            this.state.isLoading ?
                <View style={[styles.container, themeStyles.containerColorMain]}>
                    <ActivityIndicator style={styles.activityIndicator} color={themeStyles.fontColorMain.color} />
                </View>
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
        activityIndicator: {
            marginTop: 175
        },
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
