import React from 'react';
import { TrendHistoryChart } from './TrendHistoryChart';

interface PriceHistoryChartProps {
    data: any;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data }) => {
    return (
        <TrendHistoryChart
            data={data}
            dataKeyPattern={/^(\d{4})-(\d{2})-子-P$/}
            title="价格趋势 (近三年对比)"
            valuePrefix="$"
        />
    );
};
