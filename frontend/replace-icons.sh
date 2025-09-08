#!/bin/bash

# Script to replace all Heroicons with Lucide React icons

echo "Starting comprehensive icon replacement..."

# Update ErrorBoundary
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/common/ErrorBoundary.jsx
sed -i 's/ExclamationTriangleIcon/AlertTriangle/g' src/components/common/ErrorBoundary.jsx

# Update NotificationSettings
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/settings/NotificationSettings.jsx
sed -i 's/BellIcon/Bell/g' src/components/settings/NotificationSettings.jsx

# Update PrivacySettings
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/settings/PrivacySettings.jsx
sed -i 's/ShieldCheckIcon/ShieldCheck/g' src/components/settings/PrivacySettings.jsx
sed -i 's/LockClosedIcon/Lock/g' src/components/settings/PrivacySettings.jsx
sed -i 's/EyeSlashIcon/EyeOff/g' src/components/settings/PrivacySettings.jsx
sed -i 's/ExclamationTriangleIcon/AlertTriangle/g' src/components/settings/PrivacySettings.jsx

# Update Toast component
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/ui/Toast.jsx
sed -i 's/CheckCircleIcon/CheckCircle/g' src/components/ui/Toast.jsx
sed -i 's/ExclamationTriangleIcon/AlertTriangle/g' src/components/ui/Toast.jsx
sed -i 's/InformationCircleIcon/Info/g' src/components/ui/Toast.jsx
sed -i 's/XCircleIcon/XCircle/g' src/components/ui/Toast.jsx
sed -i 's/XMarkIcon/X/g' src/components/ui/Toast.jsx

# Update messaging components
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/messaging/MessageBubble.jsx
sed -i 's/DocumentIcon/File/g' src/components/messaging/MessageBubble.jsx
sed -i 's/PhotoIcon/Image/g' src/components/messaging/MessageBubble.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/messaging/ChatWindow.jsx
sed -i 's/PaperAirplaneIcon/Send/g' src/components/messaging/ChatWindow.jsx
sed -i 's/PaperClipIcon/Paperclip/g' src/components/messaging/ChatWindow.jsx
sed -i 's/EllipsisVerticalIcon/MoreVertical/g' src/components/messaging/ChatWindow.jsx
sed -i 's/PhoneIcon/Phone/g' src/components/messaging/ChatWindow.jsx
sed -i 's/VideoCameraIcon/Video/g' src/components/messaging/ChatWindow.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/messaging/ChatList.jsx
sed -i 's/ChatBubbleLeftRightIcon/MessageCircle/g' src/components/messaging/ChatList.jsx

# Update video components
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/video/ConnectionQualityIndicator.jsx
sed -i 's/WifiIcon/Wifi/g' src/components/video/ConnectionQualityIndicator.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/video/WaitingRoom.jsx
sed -i 's/VideoCameraIcon/Video/g' src/components/video/WaitingRoom.jsx
sed -i 's/MicrophoneIcon/Mic/g' src/components/video/WaitingRoom.jsx
sed -i 's/SpeakerWaveIcon/Volume2/g' src/components/video/WaitingRoom.jsx
sed -i 's/ClockIcon/Clock/g' src/components/video/WaitingRoom.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/video/DeviceCheckModal.jsx
sed -i 's/VideoCameraIcon/Video/g' src/components/video/DeviceCheckModal.jsx
sed -i 's/MicrophoneIcon/Mic/g' src/components/video/DeviceCheckModal.jsx
sed -i 's/SpeakerWaveIcon/Volume2/g' src/components/video/DeviceCheckModal.jsx
sed -i 's/ExclamationTriangleIcon/AlertTriangle/g' src/components/video/DeviceCheckModal.jsx
sed -i 's/CheckCircleIcon/CheckCircle/g' src/components/video/DeviceCheckModal.jsx

# Update dashboard components
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/MoodCheckInCard.jsx
sed -i 's/HeartIcon/Heart/g' src/components/dashboard/MoodCheckInCard.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/UtilizationChart.jsx
sed -i 's/ChartBarIcon/BarChart/g' src/components/dashboard/UtilizationChart.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/QuickNotesCard.jsx
sed -i 's/DocumentTextIcon/FileText/g' src/components/dashboard/QuickNotesCard.jsx
sed -i 's/PlusIcon/Plus/g' src/components/dashboard/QuickNotesCard.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/NextSessionCard.jsx
sed -i 's/CalendarIcon/Calendar/g' src/components/dashboard/NextSessionCard.jsx
sed -i 's/ClockIcon/Clock/g' src/components/dashboard/NextSessionCard.jsx
sed -i 's/VideoCameraIcon/Video/g' src/components/dashboard/NextSessionCard.jsx
sed -i 's/UserIcon/User/g' src/components/dashboard/NextSessionCard.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/RecentActivityCard.jsx
sed -i 's/ClockIcon/Clock/g' src/components/dashboard/RecentActivityCard.jsx
sed -i 's/UserIcon/User/g' src/components/dashboard/RecentActivityCard.jsx
sed -i 's/CalendarIcon/Calendar/g' src/components/dashboard/RecentActivityCard.jsx
sed -i 's/ChatBubbleLeftRightIcon/MessageCircle/g' src/components/dashboard/RecentActivityCard.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/QuickActionsCard.jsx
sed -i 's/PlusIcon/Plus/g' src/components/dashboard/QuickActionsCard.jsx
sed -i 's/CalendarIcon/Calendar/g' src/components/dashboard/QuickActionsCard.jsx
sed -i 's/ChatBubbleLeftRightIcon/MessageCircle/g' src/components/dashboard/QuickActionsCard.jsx
sed -i 's/DocumentTextIcon/FileText/g' src/components/dashboard/QuickActionsCard.jsx
sed -i 's/UserIcon/User/g' src/components/dashboard/QuickActionsCard.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/PendingMessagesCard.jsx
sed -i 's/ChatBubbleLeftRightIcon/MessageCircle/g' src/components/dashboard/PendingMessagesCard.jsx
sed -i 's/UserIcon/User/g' src/components/dashboard/PendingMessagesCard.jsx
sed -i 's/ClockIcon/Clock/g' src/components/dashboard/PendingMessagesCard.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/SystemHealthCard.jsx
sed -i 's/ServerIcon/Server/g' src/components/dashboard/SystemHealthCard.jsx
sed -i 's/CpuChipIcon/Cpu/g' src/components/dashboard/SystemHealthCard.jsx
sed -i 's/CloudIcon/Cloud/g' src/components/dashboard/SystemHealthCard.jsx
sed -i 's/SignalIcon/Signal/g' src/components/dashboard/SystemHealthCard.jsx

sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/dashboard/TenantOverviewCard.jsx
sed -i 's/BuildingOfficeIcon/Building/g' src/components/dashboard/TenantOverviewCard.jsx
sed -i 's/UserGroupIcon/Users/g' src/components/dashboard/TenantOverviewCard.jsx
sed -i 's/ChartBarIcon/BarChart/g' src/components/dashboard/TenantOverviewCard.jsx

# Update crisis button
sed -i 's/@heroicons\/react\/24\/outline/lucide-react/g' src/components/crisis/CrisisButton.jsx
sed -i 's/ExclamationTriangleIcon/AlertTriangle/g' src/components/crisis/CrisisButton.jsx
sed -i 's/PhoneIcon/Phone/g' src/components/crisis/CrisisButton.jsx
sed -i 's/XMarkIcon/X/g' src/components/crisis/CrisisButton.jsx

echo "Icon replacement complete!"
