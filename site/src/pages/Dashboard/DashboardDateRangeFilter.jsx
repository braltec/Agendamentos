import { useEffect, useState } from 'react'
import { Calendar, SlidersHorizontal } from 'lucide-react'
import {
  buildDateRangeLabel,
  DASHBOARD_PERIOD_PRESETS,
  getDateRangeFromPreset,
  validateDateRange,
} from '../../utils/dashboardDateRange'

export default function DashboardDateRangeFilter({ value, onChange }) {
  const [customStartDate, setCustomStartDate] = useState(value.startDate || '')
  const [customEndDate, setCustomEndDate] = useState(value.endDate || '')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setCustomStartDate(value.startDate || '')
    setCustomEndDate(value.endDate || '')
    setErrorMessage('')
  }, [value.startDate, value.endDate, value.preset])

  const handlePresetChange = (event) => {
    const preset = event.target.value

    if (preset === 'personalizado') {
      onChange({
        preset,
        startDate: value.startDate,
        endDate: value.endDate,
      })
      return
    }

    onChange(getDateRangeFromPreset(preset))
  }

  const applyCustomRange = () => {
    const nextRange = {
      preset: 'personalizado',
      startDate: customStartDate,
      endDate: customEndDate,
    }
    const validationMessage = validateDateRange(nextRange)

    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setErrorMessage('')
    onChange(nextRange)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            Período do dashboard
          </div>
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">{buildDateRangeLabel(value)}</span>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:auto-cols-max lg:grid-flow-col lg:grid-cols-none lg:items-end">
          <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
            <span>Preset</span>
            <select
              value={value.preset}
              onChange={handlePresetChange}
              className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
            >
              {DASHBOARD_PERIOD_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          {value.preset === 'personalizado' && (
            <>
              <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
                <span>Data inicial</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
                <span>Data final</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-gray-300 px-3 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
                />
              </label>
              <button
                type="button"
                onClick={applyCustomRange}
                className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:col-span-2 lg:col-span-1"
              >
                Aplicar
              </button>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
