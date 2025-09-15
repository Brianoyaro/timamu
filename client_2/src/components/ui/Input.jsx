import React from 'react'
import clsx from 'clsx'

/**
 * Reusable Input component with validation states and icons
 * Supports different types and provides consistent styling
 */
const Input = React.forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = true,
  leftIcon,
  rightIcon,
  className,
  labelClassName,
  inputClassName,
  ...props
}, ref) => {
  const inputId = props.id || props.name

  const inputClasses = clsx(
    'block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors duration-200',
    {
      'border-gray-300 focus:ring-primary-500 focus:border-primary-500': !error,
      'border-error-300 text-error-900 placeholder-error-300 focus:ring-error-500 focus:border-error-500': error,
      'bg-gray-50 cursor-not-allowed': disabled,
      'w-full': fullWidth,
      'pl-10': leftIcon,
      'pr-10': rightIcon,
    },
    inputClassName
  )

  const labelClasses = clsx(
    'block text-sm font-medium text-gray-700 mb-1',
    labelClassName
  )

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={clsx(
              'text-gray-400',
              error && 'text-error-400'
            )}>
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className={clsx(
              'text-gray-400',
              error && 'text-error-400'
            )}>
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-error-600">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
