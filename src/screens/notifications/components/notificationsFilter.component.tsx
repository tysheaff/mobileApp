import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { FlatList } from 'react-native-gesture-handler';
import { themeStyles } from '@styles/globalColors';
import { settingsGlobals } from '@globals/settingsGlobals';

declare type filterId = 'follow' | 'like' | 'reply' | 'mention' | 'reclout' | 'purchase' | 'diamond' | 'creatorCoinTransfer';
interface FilterChip {
    id: filterId;
    passive: string;
    active: string;
}

export type NotificationsFilter = {
    [key in filterId]: boolean;
};

interface Props {
    filter?: NotificationsFilter;
    onFilterChange: (p_filter: NotificationsFilter) => void;
}

interface State {
    filter: NotificationsFilter;
}

const getFilterChips = (): FilterChip[] => [
    {
        id: 'follow',
        passive: 'rgba(3, 119, 252, 0.3)',
        active: '#0377fc'
    },
    {
        id: 'like',
        passive: 'rgba(235, 27, 12, 0.3)',
        active: '#eb1b0c'
    },
    {
        id: 'reply',
        passive: 'rgba(53, 153, 212, 0.3)',
        active: '#3599d4'
    },
    {
        id: 'mention',
        passive: 'rgba(252, 186, 3, 0.3)',
        active: '#fcba03'
    },
    {
        id: 'reclout',
        passive: 'rgba(91, 163, 88, 0.3)',
        active: '#5ba358'
    },
    {

        id: 'purchase',
        passive: 'rgba(0, 128, 60, 0.3)',
        active: '#00803c'
    },
    {
        id: 'diamond',
        passive: 'rgba(0, 128, 60, 0.3)',
        active: '#00803c'
    },
    {
        id: 'creatorCoinTransfer',
        passive: 'rgba(0, 128, 60, 0.3)',
        active: '#00803c'
    }
];

export class NotificationsFilterComponent extends React.Component<Props, State>{

    private readonly _chips: FilterChip[] = getFilterChips();

    constructor(props: Props) {
        super(props);

        this.state = {
            filter: this.props.filter ? this.props.filter : {
                follow: false,
                like: false,
                reply: false,
                mention: false,
                diamond: false,
                creatorCoinTransfer: false,
                reclout: false,
                purchase: false
            }
        };

        this.toggleFilter = this.toggleFilter.bind(this);
    }

    toggleFilter(p_chip: FilterChip) {
        const newFilter = this.state.filter;
        newFilter[p_chip.id] = !newFilter[p_chip.id];
        this.setState({ filter: newFilter });

        if (this.props.onFilterChange != null) {
            this.props.onFilterChange(newFilter);
        }
    }

    render() {
        const getIConColor = (p_filterId: filterId): string => this.state.filter[p_filterId] ? 'white' : settingsGlobals.darkMode ? themeStyles.fontColorSub.color : 'white';

        const renderChipIcon = (p_chipId: filterId) => {
            switch (p_chipId) {
                case 'follow':
                    return <MaterialCommunityIcons name="account" size={19} color={getIConColor(p_chipId)} />;
                case 'like':
                    return <Ionicons name={'ios-heart-sharp'} size={17} color={getIConColor(p_chipId)} />;
                case 'reply':
                    return <FontAwesome name="comment" size={16} color={getIConColor(p_chipId)} />;
                case 'mention':
                    return <FontAwesome style={[{ marginLeft: 1 }]} name="commenting" size={16} color={getIConColor(p_chipId)} />;
                case 'reclout':
                    return <FontAwesome name="retweet" size={17} color={getIConColor(p_chipId)} />;
                case 'purchase':
                    return <FontAwesome name="dollar" size={18} color={getIConColor(p_chipId)} />;
                case 'diamond':
                    return <FontAwesome name="diamond" size={16} color={getIConColor(p_chipId)} />;
                case 'creatorCoinTransfer':
                    return <FontAwesome name="send" size={16} color={getIConColor(p_chipId)} />;
            }
        };

        const renderChip = (p_chip: FilterChip) => {
            return <TouchableOpacity
                onPress={() => this.toggleFilter(p_chip)}
            >
                <View style={[
                    styles.filterChip,
                    { backgroundColor: this.state.filter[p_chip.id] ? p_chip.active : p_chip.passive }
                ]}>
                    {renderChipIcon(p_chip.id)}
                </View>
            </TouchableOpacity>;
        };

        const keyExtractorChips = (item: FilterChip) => item.id;

        return <FlatList
            style={[styles.container]}
            horizontal
            showsVerticalScrollIndicator={false}
            keyExtractor={keyExtractorChips}
            renderItem={({ item }) => renderChip(item)}
            data={this._chips}
            showsHorizontalScrollIndicator={false}
        />;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            paddingBottom: 10,
            height: 45,
            maxHeight: 45
        },
        filterChip: {
            width: 40,
            height: 32,
            borderRadius: 50,
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 8
        }
    }
);
