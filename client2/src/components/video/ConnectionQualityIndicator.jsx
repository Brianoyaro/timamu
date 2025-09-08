import React from 'react'
import { WifiIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

export function ConnectionQualityIndicator({ quality = 'good' }) {
  const qualityConfig = {
    excellent: {
      color: 'text-green-400',
      label: 'Excellent',
      bars: 4
    },
    good: {
      color: 'text-green-400',
      label: 'Good',
      bars: 3
    },
    fair: {
      color: 'text-yellow-400',
      label: 'Fair',
      bars: 2
    },
    poor: {
      color: 'text-red-400',
      label: 'Poor',
      bars: 1
    }
  }

  const config = qualityConfig[quality]

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={clsx(
              'w-1 rounded-full transition-colors',
              i < config.bars ? config.color : 'text-gray-600',
              `h-${2 + i}` // Progressive height: h-2, h-3, h-4, h-5
            )}
            style={{ height: `${(i + 2) * 2}px` }}
          />
        ))}
      </div>
      
      <span className={clsx('text-xs', config.color)}>
        {config.label}
      </span>
    </div>
  )
}
