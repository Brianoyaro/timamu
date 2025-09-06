import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff
} from 'lucide-react'
import clsx from 'clsx'

export function VideoControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onShareScreen,
  onEndCall
}) {
  const { t } = useTranslation()

  const controls = [
    {
      key: 'audio',
      icon: isAudioEnabled ? Mic : MicOff,
      label: t('video.toggleMic'),
      onClick: onToggleAudio,
      isActive: isAudioEnabled,
      className: isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
    },
    {
      key: 'video',
      icon: isVideoEnabled ? Video : VideoOff,
      label: t('video.toggleCamera'),
      onClick: onToggleVideo,
      isActive: isVideoEnabled,
      className: isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
    },
    {
      key: 'screen',
      icon: Monitor,
      label: t('video.shareScreen'),
      onClick: onShareScreen,
      isActive: isScreenSharing,
      className: isScreenSharing ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-700 hover:bg-gray-600'
    }
  ]

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-4">
      <div className="flex items-center justify-center space-x-4">
        {controls.map((control) => (
          <button
            key={control.key}
            onClick={control.onClick}
            className={clsx(
              'p-3 rounded-full text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800',
              control.className
            )}
            aria-label={control.label}
            title={control.label}
          >
            <control.icon className="h-5 w-5" />
          </button>
        ))}

        {/* End call button */}
        <button
          onClick={onEndCall}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
          aria-label={t('video.endCall')}
          title={t('video.endCall')}
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
