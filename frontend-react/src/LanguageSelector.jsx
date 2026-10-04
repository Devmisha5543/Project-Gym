import { useTranslation } from 'react-i18next'

export default function LanguageSelector() {
  const { t, i18n } = useTranslation('settings')
  const language = i18n.resolvedLanguage || 'en'

  return (
    <div className="settings-language-control">
      <label htmlFor="ui-language-select">{t('language')}</label>
      <p id="ui-language-description">{t('languageDescription')}</p>
      <select
        id="ui-language-select"
        value={language}
        aria-describedby="ui-language-description"
        onChange={event => i18n.changeLanguage(event.target.value)}
      >
        <option value="en">{t('english')}</option>
        <option value="am">{t('amharic')}</option>
      </select>
    </div>
  )
}
