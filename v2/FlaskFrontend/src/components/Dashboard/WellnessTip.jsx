import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiStar, FiFeather, FiCloud, FiHeart, FiSmile, FiSun, FiUsers, FiMoon, FiWind } from 'react-icons/fi';
import wellnessService from '../../utils/wellnessService';

const iconMap = {
    FiFeather,
    FiCloud,
    FiHeart,
    FiSmile,
    FiSun,
    FiUsers,
    FiMoon,
    FiWind,
    FiStar
};

const WellnessTip = () => {
    const [tip, setTip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadTip();
    }, []);

    const loadTip = async () => {
        try {
            setLoading(true);
            const newTip = await wellnessService.getTip();
            setTip(newTip);
        } catch (error) {
            console.error('Error loading wellness tip:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            const newTip = await wellnessService.refreshTip();
            setTip(newTip);
        } catch (error) {
            console.error('Error refreshing wellness tip:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const IconComponent = tip ? iconMap[wellnessService.getCategoryIcon(tip.category)] : FiStar;
    const color = tip ? wellnessService.getCategoryColor(tip.category) : 'blue';

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 animate-pulse">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        <div className="h-6 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gradient-to-br from-${color}-50 to-white rounded-xl border border-${color}-200`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${color}-100 rounded-lg`}>
                            <IconComponent className={`h-5 w-5 text-${color}-600`} />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">Wellness Tip</h2>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`p-2 hover:bg-${color}-100 rounded-lg transition-colors disabled:opacity-50`}
                        title="Get new tip"
                    >
                        <FiRefreshCw className={`h-4 w-4 text-${color}-600 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <p className={`text-${color}-900 mb-4`}>
                    {tip?.tip || "Take a moment to breathe and center yourself."}
                </p>
                <div className={`flex items-center gap-2 text-sm text-${color}-600 font-medium`}>
                    <IconComponent className="h-4 w-4" />
                    <span className="capitalize">{tip?.category?.replace('-', ' ') || 'Mindfulness'}</span>
                </div>
            </div>
        </div>
    );
};

export default WellnessTip;