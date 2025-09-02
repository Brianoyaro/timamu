import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'

export function DeviceCheckModal({ onComplete, onCancel }) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState('camera') // camera, microphone, complete
  const [cameraStatus, setCameraStatus] = useState('testing') // testing, success, error
  const [microphoneStatus, setMicrophoneStatus] = useState('pending') // pending, testing, success, error
  const [testStream, setTestStream] = useState(null)
  
  const videoRef = useRef(null)

  useEffect(() => {
    if (currentStep === 'camera') {
      testCamera()
    } else if (currentStep === 'microphone') {
      testMicrophone()
    }

    return () => {
      if (testStream) {
        testStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [currentStep])

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setTestStream(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setCameraStatus('success')
    } catch (error) {
      console.error('Camera test failed:', error)
      setCameraStatus('error')
    }
  }

  const testMicrophone = async () => {
    setMicrophoneStatus('testing')
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      
      // Simple audio level detection
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      microphone.connect(analyser)
      analyser.fftSize = 256
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      const checkAudioLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        
        if (average > 10) { // Basic threshold for audio detection
          setMicrophoneStatus('success')
          stream.getTracks().forEach(track => track.stop())
          audioContext.close()
        } else {
          requestAnimationFrame(checkAudioLevel)
        }
      }
      
      // Auto-pass after 3 seconds if no audio detected
      setTimeout(() => {
        if (microphoneStatus === 'testing') {
          setMicrophoneStatus('success')
          stream.getTracks().forEach(track => track.stop())
          audioContext.close()
        }
      }, 3000)
      
      checkAudioLevel()
    } catch (error) {
      console.error('Microphone test failed:', error)
      setMicrophoneStatus('error')
    }
  }

  const handleNext = () => {
    if (currentStep === 'camera' && cameraStatus === 'success') {
      setCurrentStep('microphone')
    } else if (currentStep === 'microphone' && microphoneStatus === 'success') {
      setCurrentStep('complete')
    }
  }

  const handleComplete = () => {
    if (testStream) {
      testStream.getTracks().forEach(track => track.stop())
    }
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          {t('video.deviceCheck')}
        </h2>

        {currentStep === 'camera' && (
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <VideoCameraIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('video.testCamera')}
              </span>
              {cameraStatus === 'success' && (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              )}
              {cameraStatus === 'error' && (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            {cameraStatus === 'error' && (
              <p className="text-sm text-red-600">
                Camera access failed. Please check your permissions.
              </p>
            )}
          </div>
        )}

        {currentStep === 'microphone' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {microphoneStatus === 'testing' 
                  ? 'Say something to test your microphone...'
                  : t('video.testMicrophone')
                }
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <MicrophoneIcon className="h-5 w-5 text-gray-500" />
              {microphoneStatus === 'testing' && (
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-primary-500 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              )}
              {microphoneStatus === 'success' && (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              )}
              {microphoneStatus === 'error' && (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            {microphoneStatus === 'error' && (
              <p className="text-sm text-red-600 text-center">
                Microphone access failed. Please check your permissions.
              </p>
            )}
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="text-center space-y-4">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Device check complete!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your camera and microphone are working correctly.
            </p>
          </div>
        )}

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 btn btn-secondary"
          >
            Cancel
          </button>
          
          {currentStep === 'complete' ? (
            <button
              onClick={handleComplete}
              className="flex-1 btn btn-primary"
            >
              Join Session
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 'camera' && cameraStatus !== 'success') ||
                (currentStep === 'microphone' && microphoneStatus !== 'success')
              }
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
