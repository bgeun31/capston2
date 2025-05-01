"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface NetworkChartProps {
  fullSize?: boolean
}

export function NetworkChart({ fullSize = false }: NetworkChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // 실제 구현에서는 API에서 데이터를 가져오거나 웹소켓을 사용할 수 있습니다
    const initialData = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      inbound: Math.floor(Math.random() * 1000) + 200,
      outbound: Math.floor(Math.random() * 800) + 100,
      malicious: Math.floor(Math.random() * 50),
    }))

    setData(initialData)

    // 실시간 데이터 시뮬레이션
    const interval = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData]
        newData.shift()
        const lastHour = Number.parseInt(newData[newData.length - 1].time)
        const nextHour = (lastHour + 1) % 24

        newData.push({
          time: `${nextHour}:00`,
          inbound: Math.floor(Math.random() * 1000) + 200,
          outbound: Math.floor(Math.random() * 800) + 100,
          malicious: Math.floor(Math.random() * 50),
        })

        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <ResponsiveContainer width="100%" height={fullSize ? 400 : 300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="time" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#333",
            border: "1px solid #555",
            borderRadius: "4px",
            color: "#fff",
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="inbound" stroke="#3b82f6" activeDot={{ r: 8 }} name="인바운드 트래픽" />
        <Line type="monotone" dataKey="outbound" stroke="#10b981" name="아웃바운드 트래픽" />
        <Line type="monotone" dataKey="malicious" stroke="#ef4444" name="의심스러운 트래픽" />
      </LineChart>
    </ResponsiveContainer>
  )
}
