interface TranslationCache {
  [key: string]: { [targetLang: string]: string };
}

// In-memory translation cache
const translationCache: TranslationCache = {};

// Supported languages
export const SUPPORTED_LANGUAGES = {
  'it': 'Italian',
  'en': 'English', 
  'fr': 'French',
  'de': 'German',
  'es': 'Spanish',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ar': 'Arabic'
};

export async function translateText(text: string, targetLang: string, sourceLang = 'it'): Promise<string> {
  // Return original text if same language
  if (targetLang === sourceLang) {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}_${sourceLang}`;
  if (translationCache[cacheKey] && translationCache[cacheKey][targetLang]) {
    return translationCache[cacheKey][targetLang];
  }

  // If no Google Translate API key is configured, return original text
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    return text;
  }

  try {
    // Use Google Translate API
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      return text; // Return original text on error
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;

    // Cache the translation
    if (!translationCache[cacheKey]) {
      translationCache[cacheKey] = {};
    }
    translationCache[cacheKey][targetLang] = translatedText;

    return translatedText;
  } catch (error) {
    // Silently return original text on error
    return text;
  }
}

export async function translateMenuItem(item: any, targetLang: string): Promise<any> {
  if (targetLang === 'it') return item; // Italian is the source language
  
  const translatedItem = { ...item };
  
  if (item.name) {
    translatedItem.name = await translateText(item.name, targetLang);
  }
  
  if (item.description) {
    translatedItem.description = await translateText(item.description, targetLang);
  }
  
  return translatedItem;
}

export async function translateCategory(category: any, targetLang: string): Promise<any> {
  if (targetLang === 'it') return category; // Italian is the source language
  
  const translatedCategory = { ...category };
  
  if (category.name) {
    translatedCategory.name = await translateText(category.name, targetLang);
  }
  
  if (category.description) {
    translatedCategory.description = await translateText(category.description, targetLang);
  }
  
  // Translate menu items
  if (category.items && Array.isArray(category.items)) {
    translatedCategory.items = await Promise.all(
      category.items.map((item: any) => translateMenuItem(item, targetLang))
    );
  }
  
  return translatedCategory;
}

export async function translateRestaurant(restaurant: any, targetLang: string): Promise<any> {
  if (targetLang === 'it') return restaurant; // Italian is the source language
  
  const translatedRestaurant = { ...restaurant };
  
  if (restaurant.name) {
    translatedRestaurant.name = await translateText(restaurant.name, targetLang);
  }
  
  if (restaurant.description) {
    translatedRestaurant.description = await translateText(restaurant.description, targetLang);
  }
  
  return translatedRestaurant;
}

export function detectLanguageFromRequest(req: any): string {
  // Get language from query parameter first
  if (req.query.lang && (req.query.lang as string) in SUPPORTED_LANGUAGES) {
    return req.query.lang as string;
  }
  
  // Get language from Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map((lang: string) => lang.split(';')[0].trim().substring(0, 2));
    for (const lang of languages) {
      if (lang in SUPPORTED_LANGUAGES) {
        return lang;
      }
    }
  }
  
  // Default to Italian
  return 'it';
}