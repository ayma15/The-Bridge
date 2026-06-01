const express = require('express');
const axios = require('axios');
const config = require('../config/socialBoost');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

function getMargin(rate, min, max) {
  // Margin is 80% for low price, 40% for high. (Assume >$100 is high)
  if (rate < 10) return min + 0.04; // min + 4% for micro-order
  if (rate > 100) return min; // 40%
  // Linear scale between 40%-80%
  const ratio = (100-rate)/90;
  return min + (max-min)*Math.max(0, Math.min(ratio,1));
}
// Get all services merged and categorized
router.get('/services', async (req, res) => {
  const out = [];
  for (const key of ['JAP','N1PANEL']) {
    try {
      const { apiKey, apiUrl } = config[key];
      const { data } = await axios.post(apiUrl, { key: apiKey, action: 'services' });
      for (const s of data) {
        // Hide provider, add margin
        const margin = getMargin(Number(s.rate), 0.4, 0.8);
        out.push({
          id: `${key}_${s.service}`,
          name: s.name,
          category: s.category,
          description: s.description || '',
          min: s.min,
          max: s.max,
          rate: Math.round(Number(s.rate) * (1+margin)),
          type: s.type,
          // Server/Provider identification
          provider: key, // 'N1PANEL' or 'JAP'
          server: key === 'N1PANEL' ? 'Server 1' : 'Server 2',
          // Include all API fields
          service: s.service,
          originalRate: s.rate,
          maxOrder: s.max || s.maxorder || null,
          minOrder: s.min || s.minorder || null,
          dripfeed: s.dripfeed || false,
          refill: s.refill || false,
          cancel: s.cancel || false,
          // Estimated time fields (common in SMM panels)
          averageTime: s.average_time || s.averagetime || s.avg_time || null,
          maxTime: s.max_time || s.maxtime || null,
          minTime: s.min_time || s.mintime || null,
          // Additional fields
          originalDescription: s.description || '',
          originalName: s.name || '',
          // Keep original data for reference
          _original: s
        });
      }
    } catch(e) {
      console.error(`Failed to fetch services from ${key}:`, e.message);
      // Continue with other panels even if one fails
    }
  }
  
  // Main categories (as specified by user)
  const MAIN_CATEGORIES = [
    'Instagram',
    'Facebook',
    'YouTube',
    'X',
    'Spotify',
    'TikTok',
    'LinkedIn',
    'Google',
    'Telegram',
    'Discord',
    'Snapchat',
    'Twitch',
    'Website Traffic',
    'Reviews'
  ];
  
  // Category normalization mapping (group duplicates into main categories)
  const categoryMapping = {
    // Instagram variations
    'instagram': 'Instagram',
    'ig': 'Instagram',
    'insta': 'Instagram',
    
    // Facebook variations
    'facebook': 'Facebook',
    'fb': 'Facebook',
    'meta': 'Facebook',
    
    // YouTube variations
    'youtube': 'YouTube',
    'yt': 'YouTube',
    'youtube views': 'YouTube',
    'youtube subscribers': 'YouTube',
    
    // X/Twitter variations
    'twitter': 'X',
    'x': 'X',
    'x (twitter)': 'X',
    'tweet': 'X',
    
    // Spotify variations
    'spotify': 'Spotify',
    
    // TikTok variations
    'tiktok': 'TikTok',
    'tik tok': 'TikTok',
    'tt': 'TikTok',
    
    // LinkedIn variations
    'linkedin': 'LinkedIn',
    'linked in': 'LinkedIn',
    'li': 'LinkedIn',
    
    // Google variations
    'google': 'Google',
    'google reviews': 'Google',
    'google play': 'Google',
    'gmail': 'Google',
    
    // Telegram variations
    'telegram': 'Telegram',
    'tg': 'Telegram',
    
    // Discord variations
    'discord': 'Discord',
    'dc': 'Discord',
    
    // Snapchat variations
    'snapchat': 'Snapchat',
    'snap': 'Snapchat',
    'sc': 'Snapchat',
    
    // Twitch variations
    'twitch': 'Twitch',
    'twitch tv': 'Twitch',
    
    // Website Traffic variations
    'website traffic': 'Website Traffic',
    'website': 'Website Traffic',
    'traffic': 'Website Traffic',
    'web traffic': 'Website Traffic',
    'site traffic': 'Website Traffic',
    
    // Reviews variations
    'reviews': 'Reviews',
    'review': 'Reviews',
    'rating': 'Reviews',
    'google reviews': 'Reviews',
    'trustpilot': 'Reviews',
    'yelp': 'Reviews'
  };
  
  // Subcategory keywords mapping
  const subcategoryKeywords = {
    'Views': ['view', 'watch', 'play', 'impression'],
    'Likes': ['like', 'heart', 'thumbs up'],
    'Followers': ['follower', 'subscriber', 'fan', 'member'],
    'Comments': ['comment', 'reply'],
    'Shares': ['share', 'retweet', 'repost', 'forward'],
    'Watchtime': ['watchtime', 'watch time', 'hours', 'watch hours'],
    'Live Stream': ['live', 'stream', 'livestream'],
    'Reactions': ['reaction', 'emoji', 'react'],
    'Saves': ['save', 'bookmark', 'favorite'],
    'Impressions': ['impression', 'reach', 'exposure'],
    'Clicks': ['click', 'tap', 'visit'],
    'Engagement': ['engagement', 'interaction'],
    'Plays': ['play', 'stream', 'listen'],
    'Downloads': ['download', 'dl'],
    'Subscribers': ['subscriber', 'sub', 'follow'],
    'Watch Hours': ['watch hour', 'watchtime hour']
  };
  
  // Function to normalize category name
  function normalizeCategory(category) {
    if (!category) return 'Reviews'; // Default to Reviews for uncategorized
    
    const normalized = category.trim().toLowerCase();
    
    // Direct mapping
    if (categoryMapping[normalized]) {
      return categoryMapping[normalized];
    }
    
    // Check if category contains any main category keyword
    for (const [key, mainCat] of Object.entries(categoryMapping)) {
      if (normalized.includes(key)) {
        return mainCat;
      }
    }
    
    // Check if it matches any main category (case insensitive)
    for (const mainCat of MAIN_CATEGORIES) {
      if (normalized === mainCat.toLowerCase()) {
        return mainCat;
      }
    }
    
    // Default to Reviews if no match
    return 'Reviews';
  }
  
  // Function to determine subcategory from service name
  function getSubcategory(mainCategory, serviceName) {
    const nameLower = serviceName.toLowerCase();
    
    // Check each subcategory keyword
    for (const [subcat, keywords] of Object.entries(subcategoryKeywords)) {
      for (const keyword of keywords) {
        if (nameLower.includes(keyword)) {
          return `${mainCategory} ${subcat}`;
        }
      }
    }
    
    // Default subcategory if no match
    return `${mainCategory} Services`;
  }
  
  // Create hierarchical structure: Main Category -> Subcategories -> Services
  const hierarchical = {};
  const mainCategoriesSet = new Set();
  
  // Group services hierarchically
  out.forEach(service => {
    const originalCategory = service.category || '';
    const mainCategory = normalizeCategory(originalCategory);
    const subcategory = getSubcategory(mainCategory, service.name);
    
    if (!hierarchical[mainCategory]) {
      hierarchical[mainCategory] = {};
      mainCategoriesSet.add(mainCategory);
    }
    
    if (!hierarchical[mainCategory][subcategory]) {
      hierarchical[mainCategory][subcategory] = [];
    }
    
    hierarchical[mainCategory][subcategory].push(service);
  });
  
  // Convert set to array and sort by MAIN_CATEGORIES order
  const mainCategories = MAIN_CATEGORIES.filter(cat => mainCategoriesSet.has(cat));
  
  // Define priority order for social media platforms (most used to least used)
  const socialMediaPriority = [
    'Instagram',
    'YouTube',
    'Facebook',
    'Twitter',
    'TikTok',
    'LinkedIn',
    'Telegram',
    'Pinterest',
    'Snapchat',
    'Reddit',
    'Discord',
    'Spotify',
    'SoundCloud',
    'Twitch',
    'Vimeo',
    'Dailymotion',
    'Website Traffic',
    'Other'
  ];
  
  // Sort main categories: social media first (by priority), then others alphabetically
  mainCategories.sort((a, b) => {
    const aIndex = socialMediaPriority.indexOf(a);
    const bIndex = socialMediaPriority.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
  
  // Sort subcategories within each main category
  mainCategories.forEach(mainCat => {
    const subcats = Object.keys(hierarchical[mainCat]);
    subcats.sort(); // Alphabetical for now
  });
  
  res.json({ 
    services: out,
    hierarchical: hierarchical,
    mainCategories: mainCategories
  });
});
// Place new order (panel auto-selected by id)
router.post('/order', requireAuth, async (req,res)=>{
  const { id, link, quantity } = req.body;
  const [panelKey, serviceId] = id.split('_');
  const { apiKey, apiUrl } = config[panelKey];
  try {
    const { data } = await axios.post(apiUrl, { key: apiKey, action: 'add', service: serviceId, link, quantity });
    if(data.order) return res.json({ success: true, order: data.order });
    return res.status(400).json({ success: false, error: data.error || 'Unknown error'});
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});
module.exports = router;

