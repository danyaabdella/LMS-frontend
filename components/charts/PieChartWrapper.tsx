'use client'

import React from 'react'
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js'
import { Pie } from 'react-chartjs-2'

// register required Chart.js components
ChartJS.register(ArcElement, ChartTooltip, ChartLegend)

type PieProps = React.ComponentProps<typeof Pie>

export default function PieChartWrapper(props: PieProps) {
  // react-chartjs-2's Pie is responsive by default if options.responsive !== false
  return <Pie {...props} />
}










