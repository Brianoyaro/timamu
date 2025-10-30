from flask import jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User
from .. import db
import openai
from . import wellness_bp
from datetime import datetime, timedelta
import random

# Cache to store tips and their timestamps
tip_cache = {
    'last_updated': None,
    'tips': []
}

# Categories for wellness tips
TIP_CATEGORIES = [
    'mindfulness',
    'stress-management',
    'self-care',
    'emotional-wellness',
    'healthy-habits',
    'social-connection',
    'sleep-hygiene',
    'anxiety-management'
]

def generate_tip_prompt(user_info=None):
    """Generate a context-aware prompt for the AI"""
    current_hour = datetime.utcnow().hour
    time_context = (
        "morning" if 5 <= current_hour < 12
        else "afternoon" if 12 <= current_hour < 17
        else "evening" if 17 <= current_hour < 22
        else "night"
    )
    
    base_prompt = f"Generate a short, professional wellness tip for {time_context} time that a mental health professional might give. "
    if user_info:
        base_prompt += f"Consider that the user is a {user_info.get('role', 'patient')}. "
    
    base_prompt += """
    The tip should:
    1. Be concise (max 2 sentences)
    2. Be actionable
    3. Be encouraging and positive
    4. Include a brief explanation of the benefit
    
    Format: Just the tip text without any prefix or quotes."""
    
    return base_prompt

def get_ai_wellness_tip(user_info=None):
    """Get a wellness tip from OpenAI"""
    try:
        client = openai.OpenAI(api_key=current_app.config['OPENAI_API_KEY'])
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional mental health expert providing wellness tips."},
                {"role": "user", "content": generate_tip_prompt(user_info)}
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        tip = response.choices[0].message.content.strip()
        category = random.choice(TIP_CATEGORIES)  # Assign a random category for now
        
        return {
            'tip': tip,
            'category': category,
            'created_at': datetime.utcnow().isoformat()
        }
    except Exception as e:
        current_app.logger.error(f"Error generating wellness tip: {str(e)}")
        return None

def get_fallback_tip():
    """Get a pre-written tip in case AI generation fails"""
    fallback_tips = [
        {
            'tip': "Take 5 minutes to practice deep breathing - it can help reduce stress and improve your mood.",
            'category': 'mindfulness'
        },
        {
            'tip': "Stay hydrated throughout the day to maintain energy levels and mental clarity.",
            'category': 'healthy-habits'
        },
        {
            'tip': "Take short breaks every hour to stretch and move your body.",
            'category': 'self-care'
        }
    ]
    tip = random.choice(fallback_tips)
    tip['created_at'] = datetime.utcnow().isoformat()
    return tip

@wellness_bp.route('/tips', methods=['GET'])
@jwt_required()
def get_wellness_tip():
    """Get a personalized wellness tip"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Check if we need to refresh the cache (every 3 hours)
    now = datetime.utcnow()
    if (not tip_cache['last_updated'] or 
        now - tip_cache['last_updated'] > timedelta(hours=3) or 
        not tip_cache['tips']):
        
        # Get user info for context
        user_info = {
            'role': user.role,
            'preferences': user.preferences if hasattr(user, 'preferences') else None
        }
        
        # Generate new tip
        tip = get_ai_wellness_tip(user_info)
        if not tip:
            tip = get_fallback_tip()
        
        # Update cache
        tip_cache['tips'] = [tip]  # For now just store one tip
        tip_cache['last_updated'] = now
    
    # Return the most recent tip
    return jsonify(tip_cache['tips'][0])

@wellness_bp.route('/tips/refresh', methods=['POST'])
@jwt_required()
def refresh_wellness_tip():
    """Force refresh the wellness tip"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    user_info = {
        'role': user.role,
        'preferences': user.preferences if hasattr(user, 'preferences') else None
    }
    
    # Generate new tip
    tip = get_ai_wellness_tip(user_info)
    if not tip:
        tip = get_fallback_tip()
    
    # Update cache
    tip_cache['tips'] = [tip]
    tip_cache['last_updated'] = datetime.utcnow()
    
    return jsonify(tip)