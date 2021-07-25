import React from 'react';
import { View, StyleSheet, Text, TextInput, Alert } from 'react-native';
import { themeStyles } from '@styles';
import { settingsGlobals } from '@globals/settingsGlobals';
import { TextWithLinks } from '@components/textWithLinks.component';
import { ParamListBase } from '@react-navigation/native';
import { UserSuggestionList } from '@components/userSuggestionList.component';
import { Profile } from '@types';
import CloutFeedButton from '@components/cloutfeedButton.component';
import { StackNavigationProp } from '@react-navigation/stack';

interface Props {
    recipients: Profile[];
    navigation: StackNavigationProp<ParamListBase>;
    currRecipient: string;
    setCurrRecipient: (currRecipient: string) => void;
    setRecipients: (recipients: Profile[]) => void;
}

export class RecipientInput extends React.Component<Props> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.getRecipientString = this.getRecipientString.bind(this);
        this.setFormattedCurrRecipient = this.setFormattedCurrRecipient.bind(this);
        this.addRecipient = this.addRecipient.bind(this);
        this.onButtonPress = this.onButtonPress.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private setFormattedCurrRecipient = (currText: string) => {
        const idx = currText.indexOf(' ');
        if (idx !== -1) {
            if (this._isMounted) {
                this.props.setCurrRecipient(currText.substring(0, idx));
            }
        } else {
            if (this._isMounted) {
                this.props.setCurrRecipient(currText);
            }
        }
    };

    private addRecipient(recipient: Profile) {
        if (!recipient) {
            return;
        }

        const recipients = this.props.recipients;
        let isDuplicate = false;
        for (const profile of this.props.recipients) {
            if (profile.Username === recipient.Username) {
                isDuplicate = true;
            }
        }

        if (isDuplicate) {
            return;
        }

        if (recipients.length >= 5) {
            Alert.alert(
                'Max Recipients Reached',
                'Limit of 5 recipients reached. \n\nTo issue a badge with more, visit the BitBadges website at https://bitbadges.web.app.\n\nNote: It costs 0.005 $CLOUT per recipient starting with the 5th recipient.'
            );
            return;
        }

        if (this._isMounted) {
            this.props.setCurrRecipient('');
            this.props.setRecipients([...recipients, recipient]);
        }
    }

    private getRecipientString() {
        const recipientsArr: string[] = [];
        for (const profile of this.props.recipients) {
            recipientsArr.push(profile.Username);
        }

        return recipientsArr.length > 0 ? '@' + recipientsArr.join(' @') : '';
    }

    private onButtonPress() {
        if (this._isMounted) {
            this.props.setCurrRecipient('');
            this.props.setRecipients([]);
        }
    }

    render() {
        return <View style={styles.inputContainer}>
            <Text style={[themeStyles.fontColorSub, styles.recipientsText]}>
                Recipients ({this.props.recipients.length}):{' '}
                <TextWithLinks
                    navigation={this.props.navigation}
                    isProfile
                    numberOfLines={5}
                    style={[themeStyles.fontColorSub, styles.recipientsText]}
                    text={this.getRecipientString()}
                />
            </Text>

            <View style={[styles.inputContainer, styles.textInput, themeStyles.borderColor]}>
                <Text
                    style={[
                        themeStyles.fontColorMain,
                        styles.atSymbol,
                    ]}
                >
                    @
                </Text>
                <TextInput
                    style={[
                        styles.inputField,
                        themeStyles.fontColorMain,
                    ]}
                    value={this.props.currRecipient}
                    onChangeText={this.setFormattedCurrRecipient}
                    keyboardAppearance={settingsGlobals.darkMode ? 'dark' : 'light'}
                />
                <CloutFeedButton styles={[styles.button]} title="Reset All" onPress={this.onButtonPress.bind(this)} />
            </View>
            <TextWithLinks
                style={[themeStyles.fontColorSub, styles.disclaimerText]}
                text="*Max 5 recipients. Please use https://bitbadges.web.app for more."
                navigation={this.props.navigation}
            />
            <UserSuggestionList
                keyword={this.props.currRecipient.length > 0 ? this.props.currRecipient : null}
                onSuggestionPress={this.addRecipient.bind(this)}
            />
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        inputContainer: {
            width: '83%',
            marginTop: 10,
        },
        recipientsText: {
            fontSize: 16,
            marginBottom: 5
        },
        disclaimerText: {
            fontSize: 12,
            marginBottom: 10,
            alignItems: 'center',
            justifyContent: 'center',
        },
        textInput: {
            width: '100%',
            borderBottomWidth: 1,
            marginBottom: 5,
            paddingVertical: 1,
            textAlignVertical: 'center',
            alignItems: 'center',
            flexDirection: 'row'
        },
        button: {
            width: '30%',
            marginBottom: 2,
        },
        atSymbol: {
            width: '5%',
        },
        inputField: {
            width: '65%'
        }
    }
);
