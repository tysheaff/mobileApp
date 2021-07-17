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

        const imageUri = api.getSingleProfileImage(this.props.publicKey) + '?' + new Date().toISOString();
        this.state = {
            imageUri: imageUri
        };

        this.init(imageUri);
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        return this.props.publicKey !== nextProps.publicKey ||
            this.state.imageUri !== nextState.imageUri;
    }

    private async init(imageUri: string) {
        try {
            await Image.prefetch(imageUri);
        } catch {
            if (this._isMounted) {
                this.setState({ imageUri: 'https://i.imgur.com/vZ2mB1W.png' });
            }
        }
    }

    render(): JSX.Element {
        return <Image
            style={styles.image}
            source={{ uri: this.state.imageUri }}
        />;
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
