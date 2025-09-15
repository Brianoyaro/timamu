import React from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Reusable Card component for content containers
 * Provides consistent styling and optional animations
 */
const Card = ({
  children,
  className,
  padding = 'default',
  shadow = 'default',
  rounded = 'default',
  hover = false,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-sm',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  }

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    default: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  }

  const classes = clsx(
    'bg-white border border-gray-200',
    paddingClasses[padding],
    shadowClasses[shadow],
    roundedClasses[rounded],
    hover && 'transition-shadow duration-200 hover:shadow-md',
    className
  )

  if (hover) {
    return (
      <motion.div
        className={classes}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default Card
