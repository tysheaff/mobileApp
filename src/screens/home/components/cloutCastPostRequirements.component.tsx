import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { CloutCastPromotion } from '@types';
import { themeStyles } from '@styles/globalColors';
import { calculateAndFormatBitCloutInUsd } from '@services/bitCloutCalculator';
import { CloutCastAllowedUsersModelComponent } from './cloutCastAllowedUsersModel.component';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    promotion: CloutCastPromotion;
}

interface State {
    showAllowedUsersModel: boolean;
}

export class CloutCastPostRequirementsComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            showAllowedUsersModel: false
        };
    }

    shouldComponentUpdate(p_nextProps: Props, p_nextState: State): boolean {
        return p_nextProps.promotion?.id !== this.props.promotion?.id ||
            p_nextState.showAllowedUsersModel !== this.state.showAllowedUsersModel;
    }

    render(): JSX.Element {
        const criteria = this.props.promotion?.criteria;

        let minFollowers: number | undefined = criteria?.minFollowerCount;
        if (minFollowers === 0) {
            minFollowers = undefined;
        }

        let coinPrice: number | undefined = criteria.minCoinPrice;

        if (coinPrice === 0) {
            coinPrice = undefined;
        }

        const formattedCoinPrice: string | undefined = coinPrice != null ? calculateAndFormatBitCloutInUsd(coinPrice) : undefined;

        let allowedUsersCount: number | undefined = criteria.allowedUsers?.length;
        if (allowedUsersCount === 0) {
            allowedUsersCount = undefined;
        }

        return <View style={styles.requirementsContainer}>
            <Text style={[styles.requirementsText, themeStyles.fontColorMain]}>Requirements:</Text>

            {
                minFollowers != null &&
                <>
                    <Ionicons style={{ marginLeft: 15 }} name="people" size={16} color={themeStyles.fontColorSub.color} />
                    <Text style={[styles.requirementValuetext, themeStyles.fontColorMain]}>{minFollowers}</Text>
                </>
            }

            {
                formattedCoinPrice &&
                <>
                    <FontAwesome5 style={{ marginLeft: 15 }} name="coins" size={15} color={themeStyles.fontColorSub.color} />
                    <Text style={[styles.requirementValuetext, themeStyles.fontColorMain]}>~${formattedCoinPrice}</Text>
                </>
            }

            {
                allowedUsersCount != null &&
                <TouchableOpacity
                    style={styles.allowedUsersButton}
                    onPress={() => this.setState({ showAllowedUsersModel: true })}>
                    <AntDesign style={{ marginLeft: 15 }} name="star" size={14} color={themeStyles.fontColorSub.color} />
                    <Text style={[styles.requirementValuetext, themeStyles.fontColorMain]}>{allowedUsersCount}</Text>
                </TouchableOpacity>
            }

            {
                this.state.showAllowedUsersModel &&
                <CloutCastAllowedUsersModelComponent
                    navigation={this.props.navigation}
                    publicKeys={criteria.allowedUsers}
                    close={() => this.setState({ showAllowedUsersModel: false })}></CloutCastAllowedUsersModelComponent>
            }
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        requirementsContainer: {
            flexDirection: 'row',
            paddingHorizontal: 10,
            alignItems: 'center',
            paddingTop: 15
        },
        requirementsText: {
            fontWeight: '600',
            fontSize: 12
        },
        requirementValuetext: {
            fontWeight: '600',
            marginLeft: 4,
            fontSize: 12
        },
        allowedUsersButton: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
        }
    }
);
