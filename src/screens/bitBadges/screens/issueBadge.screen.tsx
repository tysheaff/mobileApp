import { globals } from '@globals/globals';
import React, { Component } from 'react';
import ColorPicker from 'react-native-wheel-color-picker';
import { StyleSheet, Text, View, ScrollView, Alert, Switch } from 'react-native';
import { Badge, Profile } from '@types';
import { themeStyles } from '@styles/globalColors';
import { settingsGlobals } from '@globals/settingsGlobals';
import { bitBadgesApi } from '@services/api/bitBadgesApi';
import { signing } from '@services/authorization/signing';
import CloutFeedLoader from '@components/loader/cloutFeedLoader.component';
import { ParamListBase, RouteProp } from '@react-navigation/native';
import { FormInput } from '../components/formInput.component';
import { DateInput } from '../components/dateInput.component';
import { ColorInput } from '../components/colorInput.component';
import { RecipientInput } from '../components/recipientInput.component';
import { ImageInput } from '../components/imagePicker.component';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    navigation: StackNavigationProp<ParamListBase>;
    route: RouteProp<RouteParams, 'RecipientInfo'>;
    currRecipient: string;
}

type RouteParams = {
    RecipientInfo: {
        currRecipient: string;
    };
};

interface State {
    badgeImage: string;
    title: string;
    recipients: Profile[];
    issuer: string;
    externalUrl: string;
    backgroundColor: string;
    description: string;
    validDates: boolean;
    validDatesStart: Date;
    validDatesEnd: Date;
    isLoading: boolean;
    currRecipient: string;
    imageLoading: boolean;
}

export class IssueBadgeScreen extends Component<Props, State> {

    private _isMounted = false;

    private _picker: ColorPicker | null = null;

    initialState = {
        badgeImage: 'https://images.bitclout.com/59638de19a21210d7ddd47ecec5ec041532930d5ec76b88b6ccebb14b2e6f571.webp',
        title: '',
        recipients: [],
        issuer: globals.user.publicKey,
        externalUrl: '',
        backgroundColor: '#000000',
        description: '',
        validDates: false,
        validDatesStart: new Date(Date.now()),
        validDatesEnd: new Date(8640000000000000),
        isLoading: false,
        currRecipient: this.props.route.params.currRecipient,
        imageLoading: false,
    };

    constructor(props: Props) {
        super(props);
        this.state = this.initialState;

        this.toggleShowDates = this.toggleShowDates.bind(this);
        this.handleIssueBadge = this.handleIssueBadge.bind(this);
        this.resetForm = this.resetForm.bind(this);
        this.getConfirmation = this.getConfirmation.bind(this);
        this.setBackgroundColor = this.setBackgroundColor.bind(this);
        this.setBadgeImage = this.setBadgeImage.bind(this);
        this.setCurrRecipient = this.setCurrRecipient.bind(this);
        this.setDescription = this.setDescription.bind(this);
        this.setEndDate = this.setEndDate.bind(this);
        this.setImageLoading = this.setImageLoading.bind(this);
        this.setPicker = this.setPicker.bind(this);
        this.setRecipients = this.setRecipients.bind(this);
        this.setStartDate = this.setStartDate.bind(this);
        this.setTitle = this.setTitle.bind(this);
        this.setUrl = this.setUrl.bind(this);
    }

    componentDidMount() {
        this.updateNavigation();
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    updateNavigation() {
        this.props.navigation.setOptions(
            {
                headerRight: () => (
                    <CloutFeedButton
                        styles={[
                            styles.button,
                            styles.issueButton,
                        ]}
                        title="Issue"
                        onPress={this.handleIssueBadge.bind(this)}
                    />
                ),
                headerTitleStyle: {
                    color: themeStyles.fontColorMain.color,
                    alignSelf: 'center',
                },
            }
        );
    }

    private resetForm() {
        if (this._isMounted) {
            this.setState(this.initialState);
            this._picker?.revert();
        }
    }

    private getButtons = (resolve: (value: string) => void, reject: (value: string) => void) => [
        {
            text: 'Cancel',
            onPress: () => {
                reject('User cancelled action');
            },
        },
        {
            text: 'OK',
            onPress: () => {
                resolve('User approved action');
            },
        },
    ];

    private async getConfirmation() {
        let confirmed = false;

        const description = this.state.description?.trim();
        const title = this.state.title?.trim();

        const formattedDescription = description
            ? description.length > 90
                ? description.substring(0, 90) + '...'
                : description
            : 'None';

        await new Promise((resolve, reject) => {
            Alert.alert(
                'Badge Issue Confirmation',
                `IMPORTANT: Badges are permanent once issued, so please double check.\n\nTitle: ${title
                }\nIssuer: @${globals.user.username
                }\nRecipients: ${this.formatRecipientString()}\n${this.state.validDates
                    ? `Validity: Valid from ${new Date(
                        this.state.validDatesStart
                    ).toDateString()} to ${new Date(
                        this.state.validDatesEnd
                    ).toDateString()}`
                    : 'Validity: Valid forever'
                }\nDescription: ${formattedDescription}\nBackground Color: ${this.state.backgroundColor
                }\nExternal URL: ${this.state.externalUrl ? this.state.externalUrl : 'None'
                }`,
                this.getButtons(resolve, reject),
                {
                    cancelable: false,
                }
            );
        })
            .then(() => { confirmed = true; })
            .catch(() => { confirmed = false; });

        return confirmed;
    }

    private async handleIssueBadge() {
        if (this.state.isLoading) {
            return;
        }

        const title = this.state.title.trim();
        if (!title) {
            Alert.alert('Error', 'Please enter a title.');
            return;
        }

        if (title.length > 30) {
            Alert.alert('Error', 'Please keep titles under 30 characters');
            return;
        }

        const recipients = this.state.recipients;
        if (!recipients || recipients.length === 0) {
            Alert.alert(
                'Error',
                'You must have at least one recipient for your badge.'
            );
            return;
        }

        if (this.state.externalUrl.length > 0) {
            const pattern = new RegExp(
                '^(https?:\\/\\/)?' +
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
                '((\\d{1,3}\\.){3}\\d{1,3}))' +
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
                '(\\?[;&a-z\\d%_.~+=-]*)?' +
                '(\\#[-a-z\\d_]*)?$',
                'i'
            );
            const valid = !!pattern.test(this.state.externalUrl);

            if (!valid) {
                Alert.alert('Error', 'External URL is not a valid URL.');
                return;
            }
        }

        const startDate = this.state.validDatesStart;
        startDate.setHours(0, 0, 0, 0);

        const endDate = this.state.validDatesEnd;
        endDate.setHours(0, 0, 0, 0);

        if (startDate >= endDate) {
            Alert.alert('Error', 'Start date must be before end date.');
            return;
        }

        const confirmed = await this.getConfirmation();
        if (!confirmed) {
            return;
        }

        if (this._isMounted) {
            this.setState({ isLoading: true });
        }

        try {
            const jwt = await signing.signJWT();

            const response = await bitBadgesApi.issueBadge(
                title,
                endDate.getTime(),
                startDate.getTime(),
                this.state.validDates,
                this.state.description.trim(),
                this.state.backgroundColor,
                this.state.externalUrl,
                this.state.badgeImage
                    ? this.state.badgeImage
                    : 'https://images.bitclout.com/59638de19a21210d7ddd47ecec5ec041532930d5ec76b88b6ccebb14b2e6f571.webp',
                this.formatRecipientString().split('@').join('').split(' '),
                globals.user.publicKey,
                globals.user.publicKey,
                jwt,
                '',
                0
            );

            if (response.title) {
                if (this._isMounted) {
                    this.setState({ isLoading: false });
                }
            }

            const badge: Badge = response;
            const canGoBack = this.props.navigation.canGoBack();

            if (this._isMounted) {
                if (canGoBack) {
                    this.props.navigation.goBack();
                    this.props.navigation.navigate('Badge', {
                        badge,
                        issuerString: globals.user.username,
                        recipientString: this.formatRecipientString()
                    });
                }

                this.resetForm();
            }
        } catch (error) {
            globals.defaultHandleError(error);
        }
    }

    private formatRecipientString() {
        if (this.state.recipients.length === 0) return '';

        let str = '';
        for (const profile of this.state.recipients) {
            str += '@' + profile.Username + ' ';
        }

        return str.substring(0, str.length - 1);
    }

    private setBadgeImage(badgeImage: string) {
        if (this._isMounted) {
            this.setState({ badgeImage });
        }
    }

    private setImageLoading(imageLoading: boolean) {
        if (this._isMounted) {
            this.setState({ imageLoading });
        }
    }

    private setCurrRecipient(currRecipient: string) {
        if (this._isMounted) {
            this.setState({ currRecipient });
        }
    }

    private setRecipients(recipients: Profile[]) {
        if (this._isMounted) {
            this.setState({ recipients });
        }
    }

    private setTitle(text: string) {
        if (this._isMounted) {
            this.setState({ title: text });
        }
    }

    private setDescription(text: string) {
        if (this._isMounted) {
            this.setState({ description: text });
        }
    }

    private setUrl(text: string) {
        if (this._isMounted) {
            this.setState({ externalUrl: text });
        }
    }

    private setStartDate(currentDate: Date) {
        if (this._isMounted) {
            this.setState({
                validDatesStart: currentDate,
            });
        }
    }

    private setEndDate(currentDate: Date) {
        if (this._isMounted) {
            this.setState({
                validDatesEnd: currentDate,
            });
        }
    }

    private setBackgroundColor(color: string) {
        if (this._isMounted) {
            this.setState({ backgroundColor: color });
        }
    }

    private setPicker(picker: ColorPicker) {
        (this._picker = picker);
    }

    private toggleShowDates() {
        if (this._isMounted) {
            if (this.state.validDates) {
                this.setState({ validDatesEnd: new Date(8640000000000000) });
            } else {
                this.setState({ validDatesEnd: new Date(Date.now()) });
            }

            this.setState({ validDatesStart: new Date(Date.now()), validDates: !this.state.validDates });
        }
    }

    render() {
        if (this.state.isLoading) {
            return <View style={[styles.container, themeStyles.containerColorMain]}>
                <CloutFeedLoader />
            </View>;
        }

        if (globals.readonly === true) {
            return <View style={[styles.container, themeStyles.containerColorMain]}>
                <Text>You are not allowed to issue badges in read only mode!</Text>
            </View>;
        }

        return <ScrollView style={[themeStyles.containerColorMain]}>
            <View style={[styles.container, themeStyles.containerColorMain]}>
                <ImageInput
                    badgeImage={this.state.badgeImage}
                    imageLoading={this.state.imageLoading}
                    setBadgeImage={this.setBadgeImage.bind(this)}
                    setLoading={this.setImageLoading.bind(this)}
                />

                <View style={[styles.inputContainer]}>
                    <Text style={[themeStyles.fontColorSub, styles.issuerFont]}>
                        Issuer: {globals.user.username}
                    </Text>
                </View>

                <RecipientInput
                    recipients={this.state.recipients}
                    navigation={this.props.navigation}
                    currRecipient={this.state.currRecipient}
                    setCurrRecipient={this.setCurrRecipient.bind(this)}
                    setRecipients={this.setRecipients.bind(this)}
                />

                <FormInput
                    value={this.state.title}
                    onChangeText={this.setTitle.bind(this)}
                    label={'Title*'}
                    multiline={false}
                    maxLength={30}
                />

                <FormInput
                    value={this.state.description}
                    onChangeText={this.setDescription.bind(this)}
                    label={'Description'}
                    multiline={true}
                    maxLength={1048}
                />

                <FormInput
                    value={this.state.externalUrl}
                    onChangeText={this.setUrl.bind(this)}
                    label={'URL'}
                    multiline={false}
                    maxLength={200}
                />

                <View style={styles.switchInputContainer}>
                    <Text style={themeStyles.fontColorSub}>Start/End Dates</Text>
                    <Switch
                        trackColor={{
                            false: themeStyles.switchColor.color,
                            true: '#007ef5',
                        }}
                        thumbColor={'white'}
                        ios_backgroundColor={themeStyles.switchColor.color}
                        onValueChange={this.toggleShowDates.bind(this)}
                        value={this.state.validDates}
                    />
                </View>

                <DateInput
                    validDates={this.state.validDates}
                    date={this.state.validDatesStart}
                    setDate={this.setStartDate.bind(this)}
                    label="Start"
                />

                <DateInput
                    validDates={this.state.validDates}
                    date={this.state.validDatesEnd}
                    setDate={this.setEndDate.bind(this)}
                    label="End"
                />

                <ColorInput
                    setBackgroundColor={this.setBackgroundColor.bind(this)}
                    setPicker={this.setPicker.bind(this)}
                    backgroundColor={this.state.backgroundColor}
                    picker={this._picker}
                />

                <CloutFeedButton styles={[styles.inputContainer, styles.button]} title={'Clear All'} onPress={this.resetForm.bind(this)} />

            </View>

            <View style={styles.bottomPaddingContainer}></View>
        </ScrollView>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            alignItems: 'center',
        },
        button: {
            marginBottom: 8,
            marginTop: 50,
        },
        inputContainer: {
            width: '83%',
            marginTop: 10,
        },
        issueButton: {
            borderWidth: settingsGlobals.darkMode ? 1 : 0,
            marginTop: 4,
            marginRight: 6,
            marginBottom: 2,
        },
        switchInputContainer: {
            width: '83%',
            marginVertical: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        bottomPaddingContainer: {
            height: 60
        },
        issuerFont: {
            fontSize: 16
        }
    }
);

export default IssueBadgeScreen;
