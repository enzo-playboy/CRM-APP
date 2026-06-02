'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { PeriodFilter as PeriodFilterType } from '@/types'

interface PeriodFilterProps {
  period: PeriodFilterType
  onPeriodChange: (period: PeriodFilterType) => void
}

export function PeriodFilter({ period, onPeriodChange }: PeriodFilterProps) {
  const [startDate, setStartDate] = useState(period.startDate)
  const [endDate, setEndDate] = useState(period.endDate)

  const handleApply = () => {
    onPeriodChange({ startDate, endDate })
  }

  const handleQuickSelect = (months: number) => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const newPeriod = {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0],
    }
    
    setStartDate(newPeriod.startDate)
    setEndDate(newPeriod.endDate)
    onPeriodChange(newPeriod)
  }

  return (
    <div className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex-1 min-w-[150px] space-y-2">
        <Label>Data Início</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>
      <div className="flex-1 min-w-[150px] space-y-2">
        <Label>Data Fim</Label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <Button onClick={handleApply} size="sm">
        Aplicar
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => handleQuickSelect(1)}>
          1 Mês
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleQuickSelect(3)}>
          3 Meses
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleQuickSelect(6)}>
          6 Meses
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleQuickSelect(12)}>
          1 Ano
        </Button>
      </div>
    </div>
  )
}
