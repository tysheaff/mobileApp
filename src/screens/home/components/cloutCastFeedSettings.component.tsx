import { SelectListControl } from "@controls/selectList.control";
import { themeStyles } from "@styles/globalColors";
import React from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import Modal from 'react-native-modal'

export enum CloutCastFeedFilter {
    None = 'None',
    ForMe = 'ForMe'
}

export enum CloutCastFeedSort {
    None = 'None',
    HighestPayout = 'HighestPayout',
    LowestPayout = 'LowestPayout'
}

interface Props {
    filter: CloutCastFeedFilter;
    sort: CloutCastFeedSort;
    onSettingsChange: (p_filter: CloutCastFeedFilter, p_sort: CloutCastFeedSort) => void;
    isFilterShown: boolean;
}

interface State {
    filter: CloutCastFeedFilter;
    sort: CloutCastFeedSort;
}

export class CloutCastFeedSettingsComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            filter: this.props.filter,
            sort: this.props.sort,
        }

        this.onFilterValueChange = this.onFilterValueChange.bind(this);
        this.onSortValueChange = this.onSortValueChange.bind(this);
        this.onDone = this.onDone.bind(this);
    }

    onFilterValueChange(p_value: CloutCastFeedFilter) {
        this.setState({ filter: p_value });
    }

    onSortValueChange(p_value: CloutCastFeedSort) {
        this.setState({ sort: p_value });
    }

    onDone() {
        this.props.onSettingsChange(this.state.filter, this.state.sort);
    }

    render() {
        return <Modal
            animationIn={'slideInUp'}
            animationOutTiming={500}
            swipeDirection={'down'}
            onSwipeComplete={this.onDone}
            onBackdropPress={this.onDone}
            onBackButtonPress={this.onDone}
            isVisible={this.props.isFilterShown}
            propagateSwipe={true}
            style={[styles.modal]}>
            <ScrollView style={[styles.container, themeStyles.modalBackgroundColor]} bounces={false}>
                <View style={[styles.headerContainer, themeStyles.recloutBorderColor]}>
                    <Text style={[styles.showText, themeStyles.fontColorMain]}>Filter By</Text>
                </View>
                <SelectListControl
                    style={[styles.selectList]}
                    options={[
                        {
                            name: 'None',
                            value: CloutCastFeedFilter.None
                        },
                        {
                            name: 'For me',
                            value: CloutCastFeedFilter.ForMe
                        }
                    ]}
                    value={this.state.filter}
                    onValueChange={this.onFilterValueChange}
                >
                </SelectListControl>
                <View style={[styles.headerContainer, themeStyles.recloutBorderColor]}>
                    <Text style={[styles.showText, themeStyles.fontColorMain]}>Sort By</Text>
                </View>
                <SelectListControl
                    style={[styles.selectList]}
                    options={[
                        {
                            name: 'None',
                            value: CloutCastFeedSort.None
                        },
                        {
                            name: 'Highest Payout',
                            value: CloutCastFeedSort.HighestPayout
                        },
                        {
                            name: 'Lowest Payout',
                            value: CloutCastFeedSort.LowestPayout
                        }
                    ]}
                    value={this.state.sort}
                    onValueChange={this.onSortValueChange}
                >
                </SelectListControl>
            </ScrollView>
        </Modal>
    }
}

const styles = StyleSheet.create(
    {
        modal: {
            width: '100%',
            marginLeft: 0,
            marginBottom: 0
        },
        container: {
            height: '75%',
            maxHeight: 400,
            marginTop: 'auto',
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            paddingTop: 30
        },
        headerContainer: {
            borderBottomWidth: 1,
            width: '100%',
            alignItems: 'center',
            paddingBottom: 5
        },
        showText: {
            fontSize: 16,
            fontWeight: '700'
        },
        selectList: {
            width: '100%'
        }
    }
);
