import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { api } from '@services';

interface Props {
    publicKey: string;
}

interface State {
    imageUri: string;
}

export default class ProfileInfoImageComponent extends React.Component<Props, State> {

    private _isMounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            imageUri: ' '
        };

        this.init();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return this.props.publicKey !== nextProps.publicKey ||
            this.state.imageUri !== nextState.imageUri;
    }

    private async init() {
        let imageUri = api.getSingleProfileImage(this.props.publicKey);
        try {
            await Image.prefetch(imageUri);
        } catch {
            imageUri = 'https://i.imgur.com/vZ2mB1W.png';
        } finally {
        }
        if (this._isMounted) {
            this.setState({ imageUri });
        }
    }

    render() {
        return <Image style={styles.image} source={{ uri: this.state.imageUri + "?" + new Date() }} />;
    }
}

const styles = StyleSheet.create(
    {
        image: {
            width: 40,
            height: 40,
            borderRadius: 6,
            marginRight: 12
        }
    }
);
