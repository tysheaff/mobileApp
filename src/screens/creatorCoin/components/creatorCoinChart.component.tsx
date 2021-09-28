import React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { CreatorCoinTransaction } from '@types';
import { VictoryArea, VictoryAxis, VictoryChart, VictoryScatter, VictoryTooltip, VictoryTheme } from 'victory-native';
import { themeStyles } from '@styles/globalColors';
import { formatAsFullCurrency, formatNumber } from '@services/helpers';
import Svg, { Defs, LinearGradient, Stop } from 'react-native-svg';
import { DateTime, Duration } from 'luxon';
import { find, max, forEach } from 'lodash';
import { Union } from '@types';

interface Props {
    publicKey: string;
    currentCoinPrice: number;
    creatorCoinTransactions: CreatorCoinTransaction[];
}

interface State {
    now: DateTime,
    interval: ChartInterval,
}

interface ChunkToClosePrice {
    endOfChunk: DateTime,
    closePrice: number,
}

export const CHART_INTERVALS = [
    '24_hours',
    '7_days',
    '1_month',
    '6_months',
    '1_year',
    'max',
] as const;
type ChartInterval = Union<typeof CHART_INTERVALS>

interface ChartIntervalConfig {
    interval: ChartInterval,
    intervalDuration: Duration | undefined, // e.g. 24 hours for the `24_hours` interval, undefined for `max` interval
    chunkDuration: Duration, // e.g. 5 minutes for the `24_hours` interval, or 1 day for the `1_year` interval
    displayName: string,
    dateRenderer: (date: Date) => string
    dateAxisRenderer: (date: Date) => string
}

export class CreatorCoinChartComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            now: DateTime.now(),
            interval: '24_hours',
        };
    }

    // Intervals and Chunks

    hoursDateRenderer(date: Date): string {
        return DateTime.fromJSDate(date).toLocaleString(DateTime.TIME_SIMPLE);
    }

    minutesDateRenderer(date: Date): string {
        return DateTime.fromJSDate(date).toLocaleString(DateTime.DATETIME_MED);
    }

    daysDateRenderer(date: Date): string {
        // the end of a day chunk is at 12:00am on the *next* day, so we subtract 1ms from it so that it renders properly
        return DateTime.fromJSDate(date).minus(Duration.fromMillis(1)).toLocaleString(DateTime.DATE_MED);
    }

    daysShortDateRenderer(date: Date): string {
        // the end of a day chunk is at 12:00am on the *next* day, so we subtract 1ms from it so that it renders properly
        return DateTime.fromJSDate(date).minus(Duration.fromMillis(1)).toLocaleString({ month: 'short', day: 'numeric' });
    }

    monthRenderer(date: Date): string {
        return DateTime.fromJSDate(date).toLocaleString({ month: 'short' });
    }

    dateAxisRenderer(date: Date): string {
        const intervalDuration = this.state.now.diff(this.getStartOfInterval());
        if (intervalDuration < Duration.fromObject({ hours: 36 })) {
            return this.hoursDateRenderer(date);
        }
        if (intervalDuration < Duration.fromObject({ days: 60 })) {
            return this.daysShortDateRenderer(date);
        }
        return this.monthRenderer(date);
    }

    intervalConfigs: ChartIntervalConfig[] = CHART_INTERVALS.map((interval) => {
        switch (interval) {
            case '24_hours': return {
                interval,
                intervalDuration: Duration.fromObject({ hours: 24}),
                chunkDuration: Duration.fromObject({ minutes: 5 }),
                displayName: '24H',
                dateRenderer: this.minutesDateRenderer.bind(this),
                dateAxisRenderer: this.dateAxisRenderer.bind(this),
            };
            case '7_days': return {
                interval,
                intervalDuration: Duration.fromObject({ days: 7}),
                chunkDuration: Duration.fromObject({ minutes: 30 }),
                displayName: '7D',
                dateRenderer: this.minutesDateRenderer.bind(this),
                dateAxisRenderer: this.dateAxisRenderer.bind(this),
            };
            case '1_month': return {
                interval,
                intervalDuration: Duration.fromObject({ months: 1 }),
                chunkDuration: Duration.fromObject({ days: 1 }),
                displayName: '1M',
                dateRenderer: this.daysDateRenderer.bind(this),
                dateAxisRenderer: this.dateAxisRenderer.bind(this),
            };
            case '6_months': return {
                interval,
                intervalDuration: Duration.fromObject({ months: 6 }),
                chunkDuration: Duration.fromObject({ days: 1 }),
                displayName: '6M',
                dateRenderer: this.daysDateRenderer.bind(this),
                dateAxisRenderer: this.dateAxisRenderer.bind(this),
            };
            case '1_year': return {
                interval,
                intervalDuration: Duration.fromObject({ years: 1 }),
                chunkDuration: Duration.fromObject({ days: 1 }),
                displayName: '1Y',
                dateRenderer: this.daysDateRenderer.bind(this),
                dateAxisRenderer: this.dateAxisRenderer.bind(this),
            };
            case 'max': return {
                interval,
                intervalDuration: undefined,
                chunkDuration: Duration.fromObject({ days: 1 }),
                displayName: 'MAX',
                dateRenderer: this.daysDateRenderer.bind(this),
                dateAxisRenderer: this.dateAxisRenderer.bind(this),
            };
        }
    })

    getIntervalConfig(interval: ChartInterval): ChartIntervalConfig {
        return find(this.intervalConfigs, { interval }) ?? this.intervalConfigs[0];
    }

    getCurrentIntervalConfig(): ChartIntervalConfig {
        return this.getIntervalConfig(this.state.interval);
    }

    getPreviousChunk(fromDate: DateTime, intervalConfig: ChartIntervalConfig = this.getCurrentIntervalConfig()): DateTime {
        return this.getSurroundingChunk(fromDate, intervalConfig, false);
    }

    getNextChunk(fromDate: DateTime, intervalConfig: ChartIntervalConfig = this.getCurrentIntervalConfig()): DateTime {
        return this.getSurroundingChunk(fromDate, intervalConfig, true);
    }

    getStartOfInterval(intervalConfig: ChartIntervalConfig = this.getCurrentIntervalConfig()): DateTime {
        const { intervalDuration } = intervalConfig;
        const firstTxnDate = this.getDateTime(this.props.creatorCoinTransactions[0]);
        return (intervalDuration && max([this.state.now.minus(intervalDuration), firstTxnDate])) ?? firstTxnDate;
    }

    getSurroundingChunk(fromDate: DateTime, intervalConfig: ChartIntervalConfig, isNext: boolean): DateTime {
        const { chunkDuration } = intervalConfig;
        const startOfInterval = this.getStartOfInterval(intervalConfig);
        const chunkMillis = chunkDuration.shiftTo('milliseconds').milliseconds;
        const startToDateMillis = fromDate.diff(startOfInterval).shiftTo('milliseconds').milliseconds;
        const chunkIndex = Math.max(Math.floor(startToDateMillis / chunkMillis), 0) + (isNext ? 1 : 0);
        const startReference = startOfInterval.startOf('month');
        const referenceMillis = startOfInterval.diff(startReference).shiftTo('milliseconds').milliseconds;
        const remainderMillis = referenceMillis % chunkMillis;
        const startOfFirstChunk = startOfInterval.minus(Duration.fromMillis(remainderMillis));
        return startOfFirstChunk.plus(chunkDuration.mapUnits(x => x * chunkIndex));
    }

    getDateTime(txn: CreatorCoinTransaction): DateTime {
        return DateTime.fromSeconds(txn.timeStamp);
    }

    // Pricing Data

    getPriceAtCloseOfEachChunk(): ChunkToClosePrice[] {
        const intervalConfig = this.getCurrentIntervalConfig();
        const { chunkDuration } = intervalConfig;
        const firstTxnDate = this.getDateTime(this.props.creatorCoinTransactions[0]);
        const firstChunk = this.getNextChunk(firstTxnDate);
        const lastChunk = this.getNextChunk(this.state.now);

        // `endOfChunk` will be the x axis on our chart, representing the end of each chunk in the user's local timezone
        // `closePrice` will be the y axis, representing the price of the creator coin at the close of that chunk
        // we iterate through every chunk, so that there aren't gaps in the chart for chunks when no transactions occurred
        const pricesAtClose: { [key: string]: number | undefined } = {};
        let chunkIndex = 0;
        while (chunkIndex >= 0) {
            const endOfChunk = firstChunk.plus(chunkDuration.mapUnits(x => x * chunkIndex));
            pricesAtClose[endOfChunk.toISO()] = undefined;
            if (endOfChunk >= this.state.now) break;
            chunkIndex++;
        }

        // if there are no txns during the entire interval, use the current price for all chunks
        // otherwise, any chunks without a transaction get the last price we've previously seen, keeping the chart smooth
        let firstPriceInInterval: number | undefined = undefined;

        // now fill in the actual prices at the close of each day based on the transactions themselves
        this.props.creatorCoinTransactions.forEach((coinTxn) => {
            const txnDate = this.getDateTime(coinTxn);
            if (txnDate < firstChunk) return;
            const chunk = this.getNextChunk(txnDate);
            const { coinPrice } = coinTxn;
            if (!firstPriceInInterval) {
                firstPriceInInterval = coinPrice;
            }
            pricesAtClose[chunk.toISO()] = coinPrice;
        });

        let lastKnownPrice = firstPriceInInterval ?? this.props.currentCoinPrice;

        const getFinalPrice = (price: number | undefined, chunk: DateTime): number => {
            const isLastChunk = +chunk === +lastChunk;
            if (isLastChunk) {
                return this.props.currentCoinPrice;
            }
            if (price) {
                lastKnownPrice = price;
                return price;
            }
            return lastKnownPrice;
        };

        const finalPrices: ChunkToClosePrice[] = [];
        forEach(pricesAtClose, (price, chunkAsISO) => {
            const endOfChunk = DateTime.fromISO(chunkAsISO);
            const closePrice = getFinalPrice(price, endOfChunk);
            finalPrices.push({ closePrice, endOfChunk });
        });
        return finalPrices;
    }

    // should only be called once from `render`, to avoid updating more often than needed
    getChartData(): { x: Date, y: number }[] {
        return this.getPriceAtCloseOfEachChunk().map((value) => {
            return { x: value.endOfChunk.toJSDate(), y: value.closePrice };
        });
    }

    render() {
        const chartData = this.getChartData();

        return <View style={[styles.container, themeStyles.containerColorMain]}>
            {
                this.intervalConfigs.map((intervalConfig, index) => {
                    const { interval, displayName } = intervalConfig;
                    const isSelected = interval === this.state.interval;
                    return <Button
                        onPress={() => {
                            this.setState({ interval });
                        }}
                        // style={{ position: 'absolute' }}
                        title={displayName}
                        color={isSelected ? '#4eaf00': '#000000'}
                        accessibilityLabel="Learn more about this purple button"
                        key={`interval-button-${index}`}
                    />;
                })
            }
            <Svg>
                <VictoryChart
                    standalone={false}
                    // padding={{ left: 20, top: 10, bottom: 10, right: 40 }}
                    // domainPadding={{ x: [0, 80], y: [0, 80] }}
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
                        // theme={VictoryTheme.material}
                        style={{
                            grid: { strokeWidth: 0.5 },
                            // axis: { stroke: 'transparent' },
                            ticks: { stroke: 'transparent' },
                            // tickLabels: { fill: 'transparent' }
                        }}
                        domain={[
                            this.getStartOfInterval().toJSDate(),
                            this.state.now.toJSDate(),
                        ]}
                        domainPadding={0}
                        standalone={false}
                        orientation={'bottom'}
                        tickFormat={date => this.getCurrentIntervalConfig().dateAxisRenderer(date)}
                    />
                    <VictoryAxis
                        dependentAxis
                        style={{
                            grid: { strokeWidth: 0.5 },
                            axis: { stroke: 'transparent' },
                            ticks: { stroke: 'transparent' },
                            tickLabels: { fontFamily: 'Arial', fontSize: 12 }
                        }}
                        // domainPadding={10}
                        orientation={'right'}
                        tickFormat={price => `$${formatNumber(price, 0, true, 0)}`}
                    />
                    <VictoryArea
                        style={{ data: { stroke: '#0061a8', strokeWidth: 1.3, fillOpacity: 0.1, fill: 'url(#gradientStroke)' } }}
                        padding={0}
                        data={chartData}
                    />
                    <VictoryScatter
                        size={15}
                        labels={({ datum }) => {
                            const formattedDate: string = this.getCurrentIntervalConfig().dateRenderer(datum.x);
                            return `${formattedDate}\n$${formatAsFullCurrency(datum.y)}`;
                        }}
                        labelComponent={
                            <VictoryTooltip
                                dy={0}
                                // flyoutPadding={12}
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
                        data={chartData}
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
            height: 400,
            paddingBottom: 0
        }
    }
);
