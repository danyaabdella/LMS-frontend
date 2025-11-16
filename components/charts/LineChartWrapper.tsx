'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

// register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, ChartLegend, Filler)

type LineProps = React.ComponentProps<typeof Line>

export default function LineChartWrapper(props: LineProps) {
  return <Line {...props} />
}
