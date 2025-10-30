import api from './api';

const CACHE_KEY = 'wellness_tip';
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

class WellnessService {
    constructor() {
        this.tip = null;
        this.lastFetched = null;
    }

    async getTip() {
        // Check cache first
        const cachedTip = this.getCachedTip();
        if (cachedTip) {
            return cachedTip;
        }

        try {
            const response = await api.get('/wellness/tips');
            const tip = response.data;
            
            // Cache the tip
            this.cacheTip(tip);
            
            return tip;
        } catch (error) {
            console.error('Error fetching wellness tip:', error);
            // Return a fallback tip if fetch fails
            return {
                tip: "Take a moment to breathe deeply and center yourself.",
                category: "mindfulness",
                created_at: new Date().toISOString()
            };
        }
    }

    async refreshTip() {
        try {
            const response = await api.post('/wellness/tips/refresh');
            const tip = response.data;
            
            // Cache the new tip
            this.cacheTip(tip);
            
            return tip;
        } catch (error) {
            console.error('Error refreshing wellness tip:', error);
            throw error;
        }
    }

    getCachedTip() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { tip, timestamp } = JSON.parse(cached);
                
                // Check if cache is still valid
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return tip;
                }
            }
        } catch (error) {
            console.error('Error reading cached tip:', error);
        }
        return null;
    }

    cacheTip(tip) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                tip,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error caching tip:', error);
        }
    }

    getCategoryIcon(category) {
        // Map categories to React Icons
        const icons = {
            'mindfulness': 'FiFeather',
            'stress-management': 'FiCloud',
            'self-care': 'FiHeart',
            'emotional-wellness': 'FiSmile',
            'healthy-habits': 'FiSun',
            'social-connection': 'FiUsers',
            'sleep-hygiene': 'FiMoon',
            'anxiety-management': 'FiWind'
        };
        
        return icons[category] || 'FiStar';
    }

    getCategoryColor(category) {
        // Map categories to Tailwind color classes
        const colors = {
            'mindfulness': 'blue',
            'stress-management': 'purple',
            'self-care': 'indigo', // Changed from pink to indigo for better Tailwind support
            'emotional-wellness': 'yellow',
            'healthy-habits': 'green',
            'social-connection': 'blue',
            'sleep-hygiene': 'purple',
            'anxiety-management': 'teal'
        };
        
        return colors[category] || 'blue';
    }
}

export default new WellnessService();