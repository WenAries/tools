/**
 * vue-i18n 运行时配置。
 *
 * 关于复数：vue-i18n 内置的默认复数规则只区分「单数 / 复数」两态，
 * 对俄语这类需要三态（one / few / many）的语言会把 count=1 错判成第二态。
 * 这里用 CLDR 规则（Intl.PluralRules）为俄语补齐，消息书写顺序须与 forms 一致。
 */
const cldrPlural = (locale: string, forms: string[]) => {
  const rules = new Intl.PluralRules(locale)
  return (choice: number) => {
    const index = forms.indexOf(rules.select(choice))
    return index < 0 ? forms.length - 1 : index
  }
}

export default defineI18nConfig(() => ({
  fallbackLocale: 'en',
  fallbackWarn: false,
  missingWarn: false,
  pluralizationRules: {
    // ru 消息顺序：one | few | many
    ru: cldrPlural('ru', ['one', 'few', 'many'])
  }
}))
