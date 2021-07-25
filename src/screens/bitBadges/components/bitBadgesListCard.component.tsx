import React from 'react';
import { View, StyleSheet, Image, Text, Dimensions, TouchableOpacity } from 'react-native';
import { Badge } from '@types';
import { ParamListBase } from '@react-navigation/native';
import { themeStyles } from '@styles';
import { calculateDurationUntilNow } from '@services';
import { Ionicons } from '@expo/vector-icons';
import { TextWithLinks } from '@components/textWithLinks.component';
import { PendingActions } from './pendingActions.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    badge: Badge;
    isPending: boolean;
}

interface State {
    durationUntilNow: string;
    isLoading: boolean;
}

export class BitBadgesListCardComponent extends React.Component<Props, State> {

    private _valid = Date.now() < this.props.badge.validDateEnd;

    constructor(props: Props) {
        super(props);

        this.state = {
            durationUntilNow: calculateDurationUntilNow(this.props.badge?.dateCreated * 1000000),
            isLoading: false,
        };

        this.shouldComponentUpdate = this.shouldComponentUpdate.bind(this);
        this.goToBadgePage = this.goToBadgePage.bind(this);
        this.formatRecipientString = this.formatRecipientString.bind(this);
        this.formatIssuerString = this.formatIssuerString.bind(this);
    }

    shouldComponentUpdate(nextProps: Props) {
        return nextProps.badge.issuer !== this.props.badge.issuer;
    }

    private goToBadgePage() {
        this.props.navigation.push('Badge',
            {
                badge: this.props.badge,
                issuerString: this.props.badge.issuerUsername,
                recipientString: this.formatRecipientString()
            }
        );
    }

    private formatRecipientString() {
        return this.props.badge.recipientsUsernames ? '@' + this.props.badge.recipientsUsernames.join(' @') : '';
    }

    private formatIssuerString() {
        return '@' + this.props.badge.issuerUsername;
    }

    render() {
        if (!this._valid && !this.props.isPending) {
            return <></>;
        }

        return <TouchableOpacity activeOpacity={0.8} onPress={this.goToBadgePage.bind(this)}>
            <View
                style={[
                    styles.badgeListCard,
                    themeStyles.containerColorMain,
                    themeStyles.borderColor,
                ]}
            >
                <View style={styles.infoContainer}>
                    <Image
                        style={styles.badgeImage}
                        source={{
                            uri: this.props.badge?.imageUrl
                                ? this.props.badge?.imageUrl
                                : 'https://images.bitclout.com/59638de19a21210d7ddd47ecec5ec041532930d5ec76b88b6ccebb14b2e6f571.webp',
                        }}
                    />

                    <View>
                        <Text
                            style={[
                                styles.titleContainer,
                                styles.title,
                                themeStyles.fontColorMain,
                            ]}
                        >
                            {this.props.badge?.title}
                        </Text>

                        <TouchableOpacity style={styles.durationButton} activeOpacity={1}>
                            <Ionicons name="ios-time-outline" size={14} color="#a1a1a1" />
                            <Text style={styles.durationText}>
                                {this.state.durationUntilNow}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.expirationContainer}>
                    <Text style={[styles.expirationText, themeStyles.fontColorMain]}>
                        {
                            this.props.badge.validDateEnd === 8640000000000000
                                ? 'Valid Forever'
                                : new Date(this.props.badge.validDateStart).toLocaleDateString() +
                                ' - ' +
                                new Date(this.props.badge.validDateEnd).toLocaleDateString()
                        }
                    </Text>
                </View>
            </View>

            <View
                style={[
                    styles.detailsContainer,
                    themeStyles.containerColorMain,
                    themeStyles.borderColor,
                ]}
            >
                <TextWithLinks
                    style={[themeStyles.fontColorMain]}
                    navigation={this.props.navigation}
                    text={`${this.formatIssuerString()} to ${this.formatRecipientString()}`}
                />

                {
                    this.props.badge.description.length > 0 && <TextWithLinks
                        style={[themeStyles.fontColorMain, styles.additionalDetails]}
                        navigation={this.props.navigation}
                        text={
                            this.props.badge.description.length > 330
                                ? this.props.badge.description.substring(0, 330) + '...'
                                : this.props.badge.description
                        }
                    />
                }

                {
                    this.props.isPending && <PendingActions
                        badge={this.props.badge}
                        navigation={this.props.navigation}
                    />
                }
            </View>
        </TouchableOpacity>;
    }
}

const styles = StyleSheet.create(
    {
        badgeListCard: {
            flexDirection: 'row',
            paddingHorizontal: 10,
            paddingBottom: 10,
            paddingTop: 16,
            width: Dimensions.get('window').width,
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        detailsContainer: {
            paddingHorizontal: 10,
            paddingBottom: 16,
            borderBottomWidth: 1,
            width: Dimensions.get('window').width,
            minHeight: 25,
        },
        additionalDetails: {
            paddingTop: 5
        },
        infoContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        badgeImage: {
            width: 30,
            height: 30,
            borderRadius: 6,
            marginRight: 12,
        },
        titleContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        title: {
            fontWeight: '700',
            maxWidth: Dimensions.get('window').width / 2,
            marginRight: 6,
        },
        expirationContainer: {
            borderRadius: 5,
            height: 25,
            justifyContent: 'center',
            alignSelf: 'flex-start',
            maxWidth: 200,
            flexDirection: 'row',
        },
        expirationText: {
            fontSize: 12,
            fontWeight: '600',
            flexWrap: 'wrap',
        },
        durationButton: {
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 10,
        },
        durationText: {
            marginLeft: 4,
            color: '#a1a1a1',
            fontSize: 12,
        },
    }
);
