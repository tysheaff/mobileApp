import React from 'react';
import { StyleSheet, Animated, View, ScrollView, Dimensions, Text, TouchableOpacity, Platform, FlatList } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { FontAwesome } from '@expo/vector-icons';
import IntroSlideComponent from './components/introSlide.component';
import { introduction } from './components/introContent';
import { NavigationProp } from '@react-navigation/native';

interface Props {
    navigation: NavigationProp<any>;
}

interface State {
    currentSlide: number;
    totalSlides: number;
    isNext: boolean;
}

const { width: screenWidth } = Dimensions.get('screen');

export default class CloutFeedIntroduction extends React.Component<Props, State> {

    private _isMounted = false;
    private _scrollViewRef: React.RefObject<ScrollView> | any;
    private _startButtonOpacity: any = new Animated.Value(0);

    constructor(props: Props) {
        super(props);

        this.state = {
            totalSlides: 0,
            currentSlide: 1,
            isNext: false,
        };

        this._scrollViewRef = React.createRef();
        this.goToNext = this.goToNext.bind(this);
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    private calculateTotalSlides = (contentWidth: number) => {
        if (contentWidth !== 0) {
            const approxSlide: any = contentWidth / screenWidth;
            if (this.state.totalSlides !== approxSlide) {
                this.setState({
                    totalSlides: parseInt(String(Math.ceil(approxSlide.toFixed(2))))
                });
                this.setNext(introduction.length > this.state.currentSlide);
            }
        }
    }

    private handleScrollEnd = (event: any) => {
        if (!event) {
            return;
        }
        if (event.nativeEvent && event.nativeEvent.contentOffset) {
            let currentSlide = 1;
            if (event.nativeEvent.contentOffset.x === 0) {
                this.setState({ currentSlide });
            } else {
                const approxCurrentSlide: number = event.nativeEvent.contentOffset.x / screenWidth;
                currentSlide = parseInt(String(Math.ceil(approxCurrentSlide) + 1));
                this.setState({ currentSlide });
            }
            this.setNext(this.state.totalSlides > currentSlide);
        }
    }

    private goToNext() {
        if (this._scrollViewRef) {
            const scrollPoint = this.state.currentSlide * screenWidth;
            this._scrollViewRef.scrollTo({ x: scrollPoint, y: 0, animated: true });
            if (Platform.OS === 'android') {
                this.handleScrollEnd({ nativeEvent: { contentOffset: { y: 0, x: scrollPoint } } });
            }
        }
    }

    private setNext = (status: boolean) => {
        if (status !== this.state.isNext) {
            this.setState({ isNext: status });
        }
    }

    render() {
        const keyExtractor = (item: any, index: number) => `${item.toString()}_${index.toString()}`;
        const renderDots = ({ item, index }: any) => <FontAwesome
            style={[styles.dot, this.state.currentSlide === index + 1 ? styles.selectedDot : styles.notSelectedDot]}
            name="circle"
            size={8}
            color="black" />;

        if (this.state.currentSlide === introduction.length) {
            Animated.timing(this._startButtonOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
        else {
            Animated.timing(this._startButtonOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <View>
                <ScrollView
                    ref={(ref) => { this._scrollViewRef = ref }}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate={0}
                    snapToAlignment={'center'}
                    onContentSizeChange={this.calculateTotalSlides}
                    onMomentumScrollEnd={this.handleScrollEnd}
                >
                    {
                        introduction.map(
                            (item: any, index: number) => <IntroSlideComponent key={index.toString()} {...item} />
                        )
                    }
                </ScrollView>
                <View style={styles.dotsContainer}>
                    <FlatList
                        data={introduction}
                        keyExtractor={keyExtractor}
                        horizontal
                        renderItem={renderDots}
                    />
                </View>
            </View>
            <View style={styles.buttonContainer}>

                <TouchableOpacity
                    style={[styles.button, !this.state.isNext && themeStyles.buttonDisabledColor]}
                    activeOpacity={1}
                    onPress={this.goToNext}
                    disabled={!this.state.isNext}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>

                <Animated.View style={[styles.button, { opacity: this._startButtonOpacity }]}>
                    <TouchableOpacity activeOpacity={1}>
                        <Text style={styles.buttonText}>Start Clouting!</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            paddingVertical: 0,
            paddingTop: 20
        },
        buttonContainer: {
            alignItems: 'center',
            marginHorizontal: 50,
            marginBottom: 50,
            marginTop: 'auto'
        },
        button: {
            padding: 10,
            backgroundColor: 'black',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            borderRadius: 5,
            margin: 10,

        },
        buttonText: {
            color: 'white',
            fontSize: 17,
        },
        dotsContainer: {
            justifyContent: 'center',
            alignItems: 'center'
        },
        dotsContentContainerStyle: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        dot: {
            marginRight: 4
        },
        selectedDot: {
            color: '#363636'
        },
        notSelectedDot: {
            color: '#d1d1d1'
        },
    }
);
