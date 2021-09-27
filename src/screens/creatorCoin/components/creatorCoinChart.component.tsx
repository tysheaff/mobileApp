import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CreatorCoinTransaction } from '@types';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryScatter, VictoryTooltip } from 'victory-native';
import { themeStyles } from '@styles/globalColors';
import { formatAsFullCurrency, formatNumber } from '@services/helpers';
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg';
import { DateTime } from 'luxon';
import { mean, isFinite } from 'lodash';

interface Props {
    publicKey: string;
    currentCoinPrice: number;
    creatorCoinTransactions: CreatorCoinTransaction[];
}

interface State {
    aggregatedData: { x: Date, y: number }[];
}

interface DayToAveragePrice {
    startOfDay: Date,
    price: number,
}

export class CreatorCoinChartComponent extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        const pricesByDay = this.getPricePerDay();
        const aggregatedData: { x: Date, y: number }[] = [];
        pricesByDay.forEach((value: DayToAveragePrice) => {
            aggregatedData.push({ x: value.startOfDay, y: value.price });
        });

        this.state = { aggregatedData };
    }

    shouldComponentUpdate(p_nextProps: Props) {
        return p_nextProps.creatorCoinTransactions.length !== this.props.creatorCoinTransactions.length;
    }

    startOfDay(coinTxn: CreatorCoinTransaction): DateTime {
        const timestamp = DateTime.fromSeconds(coinTxn.timeStamp);
        return timestamp.startOf('day');
    }

    getPricePerDay(): DayToAveragePrice[] {
        const firstTxn = this.props.creatorCoinTransactions[0];
        const firstDay = this.startOfDay(firstTxn);
        const startOfToday = DateTime.now().startOf('day');
        const durationActive = startOfToday.diff(firstDay, 'days');

        // this will be the x axis on our chart, representing the start of each day in the user's local timezone
        // we iterate through each day, so that there aren't gaps in the chart on days when no transactions occurred
        const startOfEveryDay = [...[...Array(durationActive.days).keys()].map((dayOffset) => {
            return firstDay.plus({ days: dayOffset }).toJSDate();
        }), startOfToday.toJSDate()];

        const everyDayToPrices: { [key: string]: number[] } = {};
        startOfEveryDay.forEach((startOfDay) => {
            everyDayToPrices[startOfDay.toISOString()] = [];
        });

        this.props.creatorCoinTransactions.forEach((coinTxn) => {
            const startOfDay = this.startOfDay(coinTxn).toJSDate();
            const pricesThisDay = everyDayToPrices[startOfDay.toISOString()] ?? [];
            pricesThisDay.push(coinTxn.coinPrice);
            everyDayToPrices[startOfDay.toISOString()] = pricesThisDay;
        });

        const everyDayToAveragePrice: DayToAveragePrice[] = [];
        let lastAveragePrice = 0;
        for (const [startOfDayISO, prices] of Object.entries(everyDayToPrices)) {
            const startOfDay = new Date(startOfDayISO);
            const isToday = startOfDay.getTime() === startOfToday.toJSDate().getTime();
            const price = (() => {
                // For today, take the current price rather than the average price
                if (isToday) return this.props.currentCoinPrice;
                const meanPrice = mean(prices);
                if (isFinite(meanPrice)) {
                    lastAveragePrice = meanPrice;
                    return meanPrice;
                }
                // for days with no txns, take the previous average
                return lastAveragePrice;
            })();
            everyDayToAveragePrice.push({ startOfDay, price });
        }

        return everyDayToAveragePrice;
    }

    render() {
        return <View style={[styles.container, themeStyles.containerColorMain]}>
            <Svg>
                <VictoryChart
                    standalone={false}
                    padding={{ left: 20, top: 10, bottom: 0, right: 40 }}
                    domainPadding={{ x: [0, 5], y: [0, 40] }}
                    scale={{ x: 'time' }}
                    theme={
                        {
                            axis: {
                                style: {
                                    tickLabels: {
                                        fill: themeStyles.fontColorSub.color
                                    }
                                }
                            }
                        }
                    }
                >
                    <Defs>
                        <LinearGradient id="gradientStroke"
                            x1="0%"
                            x2="0%"
                            y1="0%"
                            y2="100%"
                        >
                            <Stop offset="0%" stopColor="#1E93FA" stopOpacity="1" />
                            <Stop offset="75%" stopColor="#FFFFFF" stopOpacity="0" />
                        </LinearGradient>
                    </Defs>
                    <VictoryAxis
                        style={{
                            grid: { strokeWidth: 0 },
                            axis: { stroke: 'transparent' },
                            ticks: { stroke: 'transparent' },
                            tickLabels: { fill: 'transparent' }
                        }} />
                    <VictoryAxis
                        dependentAxis
                        style={{
                            grid: { strokeWidth: 0 },
                            axis: { stroke: 'transparent' },
                            tickLabels: { fontFamily: 'Arial', fontSize: 12 }
                        }}
                        domainPadding={1000}
                        orientation={'right'}
                        tickFormat={p_value => `$${formatNumber(p_value, 0, true, 0)}`}
                    />
                    <VictoryArea
                        animate={{
                            duration: 2000,
                            onLoad: { duration: 1000 }
                        }}
                        style={{ data: { stroke: '#0061a8', strokeWidth: 1.3, fillOpacity: 0.1, fill: 'url(#gradientStroke)' } }}
                        padding={0}
                        data={this.state.aggregatedData}
                    />
                    <VictoryScatter
                        size={15}
                        labels={({ datum }) => {
                            const formattedDate: string = DateTime.fromJSDate(datum.x).toLocaleString(DateTime.DATE_MED);
                            return `${formattedDate}\n$${formatAsFullCurrency(datum.y)}`;
                        }}
                        labelComponent={
                            <VictoryTooltip
                                dy={0}
                                flyoutPadding={12}
                                flyoutStyle={{
                                    stroke: themeStyles.borderColor.borderColor,
                                    fill: themeStyles.containerColorSub.backgroundColor,
                                }}
                                renderInPortal={false}
                            />
                        }
                        style={{
                            data: { stroke: 'none', strokeWidth: 2, fillOpacity: 0.1, fill: 'none' },
                            labels: { fill: themeStyles.fontColorMain.color, fontFamily: 'Arial' }
                        }}
                        padding={0}
                        data={this.state.aggregatedData}
                    />
                </VictoryChart>
            </Svg>
        </View>;
    }
}

const styles = StyleSheet.create(
    {
        container: {
            alignItems: 'center',
            justifyContent: 'center',
            height: 300,
            paddingBottom: 10
        }
    }
);
