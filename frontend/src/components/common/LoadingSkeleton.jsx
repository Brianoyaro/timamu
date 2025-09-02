import React from 'react'
import clsx from 'clsx'

export function LoadingSkeleton({ className = '', children }) {
  return (
    <div className={clsx('skeleton rounded', className)} aria-hidden="true">
      {children}
    </div>
  )
}
