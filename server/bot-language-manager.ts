import { storage } from "./storage";

export interface BotMessage {
  en: string;
  es: string;
  hi: string;
  [key: string]: string;
}

export interface LanguageSupport {
  code: string;
  name: string;
  flag: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageSupport> = {
  en: { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
  es: { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
  hi: { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', rtl: false },
};

export const BOT_MESSAGES: Record<string, BotMessage> = {
  welcome: {
    en: "Welcome to AutoForwardX! 🚀\n\nI'm your Telegram forwarding assistant. Type /help to see available commands.",
    es: "¡Bienvenido a AutoForwardX! 🚀\n\nSoy tu asistente de reenvío de Telegram. Escribe /help para ver los comandos disponibles.",
    hi: "AutoForwardX में आपका स्वागत है! 🚀\n\nमैं आपका टेलीग्राम फॉरवर्डिंग सहायक हूं। उपलब्ध कमांड देखने के लिए /help टाइप करें।"
  },
  
  help: {
    en: "🤖 AutoForwardX Bot Commands:\n\n" +
        "/start - Start using the bot\n" +
        "/help - Show this help message\n" +
        "/language - Change bot language\n" +
        "/login - Connect your account\n" +
        "/status - Check your forwarding status\n" +
        "/pairs - View your forwarding pairs\n" +
        "/pause - Pause all forwarding\n" +
        "/resume - Resume all forwarding\n" +
        "/stats - View forwarding statistics\n" +
        "/plan - View your current plan\n" +
        "/errors - View recent errors\n\n" +
        "Need help? Contact support!",
    es: "🤖 Comandos del Bot AutoForwardX:\n\n" +
        "/start - Comenzar a usar el bot\n" +
        "/help - Mostrar este mensaje de ayuda\n" +
        "/language - Cambiar idioma del bot\n" +
        "/login - Conectar tu cuenta\n" +
        "/status - Verificar estado de reenvío\n" +
        "/pairs - Ver tus pares de reenvío\n" +
        "/pause - Pausar todo el reenvío\n" +
        "/resume - Reanudar todo el reenvío\n" +
        "/stats - Ver estadísticas de reenvío\n" +
        "/plan - Ver tu plan actual\n" +
        "/errors - Ver errores recientes\n\n" +
        "¿Necesitas ayuda? ¡Contacta soporte!",
    hi: "🤖 AutoForwardX बॉट कमांड्स:\n\n" +
        "/start - बॉट का उपयोग शुरू करें\n" +
        "/help - यह सहायता संदेश दिखाएं\n" +
        "/language - बॉट भाषा बदलें\n" +
        "/login - अपना खाता कनेक्ट करें\n" +
        "/status - अपनी फॉरवर्डिंग स्थिति जांचें\n" +
        "/pairs - अपने फॉरवर्डिंग जोड़े देखें\n" +
        "/pause - सभी फॉरवर्डिंग रोकें\n" +
        "/resume - सभी फॉरवर्डिंग फिर से शुरू करें\n" +
        "/stats - फॉरवर्डिंग आंकड़े देखें\n" +
        "/plan - अपना वर्तमान प्लान देखें\n" +
        "/errors - हाल की त्रुटियां देखें\n\n" +
        "मदद चाहिए? सपोर्ट से संपर्क करें!"
  },

  languageSelection: {
    en: "🌐 Select your preferred language:\n\nChoose a language for bot interactions:",
    es: "🌐 Selecciona tu idioma preferido:\n\nElige un idioma para las interacciones del bot:",
    hi: "🌐 अपनी पसंदीदा भाषा चुनें:\n\nबॉट इंटरेक्शन के लिए एक भाषा चुनें:"
  },

  languageChanged: {
    en: "✅ Language changed to English successfully!",
    es: "✅ ¡Idioma cambiado a Español exitosamente!",
    hi: "✅ भाषा सफलतापूर्वक हिन्दी में बदल गई!"
  },

  loginPrompt: {
    en: "🔐 Account Login\n\nTo connect your AutoForwardX account, please enter your username:",
    es: "🔐 Inicio de Sesión\n\nPara conectar tu cuenta de AutoForwardX, por favor ingresa tu nombre de usuario:",
    hi: "🔐 खाता लॉगिन\n\nअपना AutoForwardX खाता कनेक्ट करने के लिए, कृपया अपना उपयोगकर्ता नाम दर्ज करें:"
  },

  loginSuccess: {
    en: "✅ Successfully connected to your AutoForwardX account!\n\nYou can now use bot commands to manage your forwarding.",
    es: "✅ ¡Conectado exitosamente a tu cuenta de AutoForwardX!\n\nAhora puedes usar comandos del bot para gestionar tu reenvío.",
    hi: "✅ आपके AutoForwardX खाते से सफलतापूर्वक जुड़ गया!\n\nअब आप अपनी फॉरवर्डिंग प्रबंधित करने के लिए बॉट कमांड का उपयोग कर सकते हैं।"
  },

  loginFailed: {
    en: "❌ Login failed. Please check your username and try again.",
    es: "❌ Error al iniciar sesión. Por favor verifica tu nombre de usuario e intenta de nuevo.",
    hi: "❌ लॉगिन विफल। कृपया अपना उपयोगकर्ता नाम जांचें और फिर से प्रयास करें।"
  },

  notLoggedIn: {
    en: "🔒 You need to login first. Use /login to connect your account.",
    es: "🔒 Necesitas iniciar sesión primero. Usa /login para conectar tu cuenta.",
    hi: "🔒 आपको पहले लॉगिन करना होगा। अपना खाता कनेक्ट करने के लिए /login का उपयोग करें।"
  },

  statusActive: {
    en: "✅ Forwarding Status: ACTIVE\n\n📊 Quick Stats:",
    es: "✅ Estado de Reenvío: ACTIVO\n\n📊 Estadísticas Rápidas:",
    hi: "✅ फॉरवर्डिंग स्थिति: सक्रिय\n\n📊 त्वरित आंकड़े:"
  },

  statusInactive: {
    en: "⏸️ Forwarding Status: PAUSED\n\n📊 Quick Stats:",
    es: "⏸️ Estado de Reenvío: PAUSADO\n\n📊 Estadísticas Rápidas:",
    hi: "⏸️ फॉरवर्डिंग स्थिति: रुका हुआ\n\n📊 त्वरित आंकड़े:"
  },

  pairsHeader: {
    en: "📋 Your Forwarding Pairs:",
    es: "📋 Tus Pares de Reenvío:",
    hi: "📋 आपके फॉरवर्डिंग जोड़े:"
  },

  noPairs: {
    en: "📭 No forwarding pairs found.\n\nCreate pairs through the web dashboard to start forwarding.",
    es: "📭 No se encontraron pares de reenvío.\n\nCrea pares a través del panel web para comenzar el reenvío.",
    hi: "📭 कोई फॉरवर्डिंग जोड़े नहीं मिले।\n\nफॉरवर्डिंग शुरू करने के लिए वेब डैशबोर्ड के माध्यम से जोड़े बनाएं।"
  },

  pauseSuccess: {
    en: "⏸️ All forwarding has been paused successfully.",
    es: "⏸️ Todo el reenvío ha sido pausado exitosamente.",
    hi: "⏸️ सभी फॉरवर्डिंग सफलतापूर्वक रोक दी गई है।"
  },

  resumeSuccess: {
    en: "▶️ All forwarding has been resumed successfully.",
    es: "▶️ Todo el reenvío ha sido reanudado exitosamente.",
    hi: "▶️ सभी फॉरवर्डिंग सफलतापूर्वक फिर से शुरू की गई है।"
  },

  statsHeader: {
    en: "📈 Forwarding Statistics:",
    es: "📈 Estadísticas de Reenvío:",
    hi: "📈 फॉरवर्डिंग आंकड़े:"
  },

  planHeader: {
    en: "💎 Your Current Plan:",
    es: "💎 Tu Plan Actual:",
    hi: "💎 आपका वर्तमान प्लान:"
  },

  errorsHeader: {
    en: "⚠️ Recent Errors:",
    es: "⚠️ Errores Recientes:",
    hi: "⚠️ हाल की त्रुटियां:"
  },

  noErrors: {
    en: "✅ No recent errors found. Your forwarding is running smoothly!",
    es: "✅ No se encontraron errores recientes. ¡Tu reenvío está funcionando sin problemas!",
    hi: "✅ कोई हाल की त्रुटियां नहीं मिलीं। आपकी फॉरवर्डिंग सुचारू रूप से चल रही है!"
  },

  unknownCommand: {
    en: "❓ Unknown command. Type /help to see available commands.",
    es: "❓ Comando desconocido. Escribe /help para ver los comandos disponibles.",
    hi: "❓ अज्ञात कमांड। उपलब्ध कमांड देखने के लिए /help टाइप करें।"
  },

  error: {
    en: "❌ An error occurred. Please try again later.",
    es: "❌ Ocurrió un error. Por favor intenta de nuevo más tarde.",
    hi: "❌ एक त्रुटि हुई। कृपया बाद में फिर से प्रयास करें।"
  }
};

export class BotLanguageManager {
  private static instance: BotLanguageManager;
  private userLanguages: Map<number, string> = new Map();

  static getInstance(): BotLanguageManager {
    if (!BotLanguageManager.instance) {
      BotLanguageManager.instance = new BotLanguageManager();
    }
    return BotLanguageManager.instance;
  }

  async getUserLanguage(telegramUserId: number): Promise<string> {
    if (this.userLanguages.has(telegramUserId)) {
      return this.userLanguages.get(telegramUserId)!;
    }

    try {
      // Try to get user language from database
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (user && user.preferredLanguage) {
        this.userLanguages.set(telegramUserId, user.preferredLanguage);
        return user.preferredLanguage;
      }
    } catch (error) {
      console.error('Error fetching user language:', error);
    }

    // Default to English
    this.userLanguages.set(telegramUserId, 'en');
    return 'en';
  }

  async setUserLanguage(telegramUserId: number, languageCode: string): Promise<boolean> {
    try {
      if (!SUPPORTED_LANGUAGES[languageCode]) {
        return false;
      }

      // Update in memory cache
      this.userLanguages.set(telegramUserId, languageCode);

      // Update in database
      const user = await storage.getUserByTelegramId(telegramUserId);
      if (user) {
        await storage.updateUser(user.id, { preferredLanguage: languageCode });
      }

      return true;
    } catch (error) {
      console.error('Error setting user language:', error);
      return false;
    }
  }

  async getMessage(messageKey: string, telegramUserId: number, variables?: Record<string, string>): Promise<string> {
    const userLanguage = await this.getUserLanguage(telegramUserId);
    const message = BOT_MESSAGES[messageKey];

    if (!message) {
      return `Message key '${messageKey}' not found`;
    }

    let text = message[userLanguage] || message.en || 'Message not available';

    // Replace variables if provided
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    return text;
  }

  getLanguageKeyboard(): any {
    const keyboard = Object.values(SUPPORTED_LANGUAGES).map(lang => [
      {
        text: `${lang.flag} ${lang.name}`,
        callback_data: `lang_${lang.code}`
      }
    ]);

    return {
      inline_keyboard: keyboard
    };
  }

  getSupportedLanguages(): LanguageSupport[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  isValidLanguage(languageCode: string): boolean {
    return !!SUPPORTED_LANGUAGES[languageCode];
  }

  formatStats(stats: any, language: string): string {
    const messages = {
      en: {
        pairs: 'Active Pairs',
        messages: 'Messages Forwarded',
        success: 'Success Rate',
        today: 'Today',
        total: 'Total'
      },
      es: {
        pairs: 'Pares Activos',
        messages: 'Mensajes Reenviados',
        success: 'Tasa de Éxito',
        today: 'Hoy',
        total: 'Total'
      },
      hi: {
        pairs: 'सक्रिय जोड़े',
        messages: 'संदेश भेजे गए',
        success: 'सफलता दर',
        today: 'आज',
        total: 'कुल'
      }
    };

    const labels = messages[language as keyof typeof messages] || messages.en;

    return `
${labels.pairs}: ${stats.activePairs}
${labels.messages} (${labels.today}): ${stats.messagesToday}
${labels.messages} (${labels.total}): ${stats.messagesTotal}
${labels.success}: ${stats.successRate}%
    `.trim();
  }

  formatPair(pair: any, language: string): string {
    const statusLabels = {
      en: { active: '✅ Active', paused: '⏸️ Paused', stopped: '⏹️ Stopped', error: '❌ Error' },
      es: { active: '✅ Activo', paused: '⏸️ Pausado', stopped: '⏹️ Detenido', error: '❌ Error' },
      hi: { active: '✅ सक्रिय', paused: '⏸️ रुका', stopped: '⏹️ बंद', error: '❌ त्रुटि' }
    };

    const labels = statusLabels[language as keyof typeof statusLabels] || statusLabels.en;
    const status = labels[pair.status as keyof typeof labels] || pair.status;

    return `${pair.sourceChannelTitle} → ${pair.destinationChannelTitle}\n${status}`;
  }

  formatError(error: any, language: string): string {
    const timeLabels = {
      en: 'at',
      es: 'a las',
      hi: 'पर'
    };

    const timeLabel = timeLabels[language as keyof typeof timeLabels] || timeLabels.en;
    const time = new Date(error.timestamp).toLocaleString();

    return `• ${error.message}\n  ${timeLabel} ${time}`;
  }
}

export const botLanguageManager = BotLanguageManager.getInstance();