import React from 'react';
import { StyleSheet, Animated, View, ScrollView, Dimensions, Text, TouchableOpacity, Platform, FlatList } from 'react-native';
import { themeStyles } from '@styles/globalColors';
import { FontAwesome } from '@expo/vector-icons';
import IntroSlideComponent from './components/introSlide.component';
import { introduction, IntroductionElement } from './components/introContent';
import { NavigationProp, ParamListBase } from '@react-navigation/native';

interface Props {
    navigation: NavigationProp<ParamListBase>;
}

interface State {
    currentSlide: number;
    totalSlides: number;
    isNext: boolean;
}

const { width: screenWidth } = Dimensions.get('screen');

export default class CloutFeedIntroduction extends React.Component<Props, State> {

    private _scrollViewRef: React.RefObject<ScrollView>;

    private _startButtonOpacity: Animated.Value = new Animated.Value(0);

    constructor(props: Props) {
        super(props);

        this.state = {
            totalSlides: 0,
            currentSlide: 1,
            isNext: false,
        };

        this._scrollViewRef = React.createRef();
        this.goToNext = this.goToNext.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
    }

    private calculateTotalSlides = (contentWidth: number) => {
        if (contentWidth !== 0) {
            const approxSlide = contentWidth / screenWidth;
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
                const parsedApproxCurrentSlide: number = parseInt(approxCurrentSlide.toFixed(2));
                currentSlide = parseInt(String(Math.ceil(parsedApproxCurrentSlide) + 1));
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

    private onNavigate() {
        if (this.state.currentSlide !== introduction.length) {
            return;
        }
        this.props.navigation.navigate('TermsConditions');
    }

    render(): JSX.Element {
        const keyExtractor = (_item: IntroductionElement, index: number) => index.toString();
        const renderDots = ({ index }: { index: number }) => <FontAwesome
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

        return <ScrollView style={[styles.container, themeStyles.containerColorMain]}>
            <View style={{ flex: 1 }}>
                <ScrollView
                    style={styles.scrollViewStyle}
                    ref={(ref) => { this._scrollViewRef = ref; }}
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
                            (item: IntroductionElement, index: number) => <IntroSlideComponent key={index.toString()} {...item} />
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
                    onPress={() => this.goToNext()}
                    disabled={!this.state.isNext}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>

                <Animated.View style={{ opacity: this._startButtonOpacity, width: '100%' }}>
                    <TouchableOpacity onPress={() => this.onNavigate()} style={styles.button} activeOpacity={1}>
                        <Text style={styles.buttonText}>Start Clouting!</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </ScrollView>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            flex: 1,
            paddingVertical: 0,
        },
        scrollViewStyle: {
            paddingTop: 20
        },
        buttonContainer: {
            alignItems: 'center',
            marginHorizontal: 50,
            marginBottom: 20
        },
        button: {
            padding: 10,
            backgroundColor: 'black',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            borderRadius: 5,
            marginVertical: 10,
        },
        buttonText: {
            color: 'white',
            fontSize: 17,
        },
        dotsContainer: {
            alignItems: 'center',
            marginBottom: 15,
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
