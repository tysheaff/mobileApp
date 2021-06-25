import React from 'react';
import { StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import CloutListCardComponentComponent from './cloutTagCardComponent.component';
import { cloutApi } from '@services/api/cloutApi';
import { CloutTag } from '@types';
import { themeStyles } from '@styles/globalColors';
import { isNumber } from '@services/helpers';
import { navigatorGlobals } from '@globals/navigatorGlobals';
import { globals } from '@globals/globals';
import { NavigationProp } from '@react-navigation/native';

interface Props {
    navigation: NavigationProp<any>;
    selectedTab: any;
}

interface State {
    cloutTags: CloutTag[];
    isLoading: boolean;
}

export default class CloutTagListComponent extends React.Component<Props, State> {

    private _isMounted = false;
    private _timer: number | undefined = undefined;
    private _lastCloutTagPrefix: string = '';
    private _topCloutTags: CloutTag[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            cloutTags: [],
            isLoading: true,
        };

        this.init = this.init.bind(this);
        this.init();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    componentDidUpdate() {
        const { tabName } = this.props.selectedTab;
        if (tabName === 'CloutTags') {
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

                                if (this._isMounted) {
                                    this.setState({ cloutTags: response, isLoading: false });
                                }
                                this._timer = undefined;
                            }
                            catch (p_error) {
                                globals.defaultHandleError(p_error);
                            }
                        },
                        500
                    );
                }
            };
        }
    }

    async init() {
        const response = await cloutApi.getTrendingClouts(50);
        if (this._isMounted) {
            this._topCloutTags = response;
            this.setState({ cloutTags: response, isLoading: false });
        }
    }

    render() {

        const renderItem = (item: CloutTag) =>
            <CloutListCardComponentComponent
                navigation={this.props.navigation}
                cloutTag={item} />;
        const keyExtractor = (item: CloutTag, index: number) => `${item.clouttag}_${index}`;

        return (
            this.state.isLoading
                ? <ActivityIndicator
                    style={styles.activityIndicator}
                    color={themeStyles.fontColorMain.color}
                />
                : this.state.cloutTags.length !== 0 ?
                    <FlatList
                        data={this.state.cloutTags}
                        renderItem={({ item }) => renderItem(item)}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.flatList}
                    />
                    : <Text style={[themeStyles.fontColorSub, styles.noResults]}>No CloutTags for "{this._lastCloutTagPrefix}"</Text>
        )
    }
}
const styles = StyleSheet.create({
    activityIndicator: {
        marginTop: 175
    },
    flatList: {
        paddingVertical: 10,
    },
    noResults: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 40,
    }
})